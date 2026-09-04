const express = require("express");
const TimetableSlot = require("../models/TimetableSlot");
const Faculty = require("../models/Faculty");
const Leave = require("../models/Leave");
const { toDate } = require("../lib/attendance");
const { route, badRequest } = require("../lib/http");

const router = express.Router();

/**
 * Who's actually unavailable today, straight from the Leave collection's own
 * approved, in-range requests — not `Faculty.status`. That field is only a
 * denormalized cache `PATCH /faculty/leaves/:id/status` writes at the moment
 * a decision is made; it drifts from the truth in both directions (a leave
 * still Pending can leave `status` at a stale "On leave" from an old record,
 * and nothing ever flips it back once an approved leave's date range ends).
 * Restaffing around a teacher who was never actually approved off — or who
 * came back weeks ago — is exactly the kind of false-data conflict this
 * avoids by checking the real source every time instead of a cached flag.
 *
 * `toDate()` (not `toISOString().slice(0, 10)`) — the latter normalises to
 * UTC, a different calendar day from local time for a good chunk of the
 * clock (e.g. any time before 5:30am IST), while `Leave.from`/`to` are plain
 * "YYYY-MM-DD" strings meant in local time like every other date in this
 * app. It's the same local-day helper `lib/attendance.js` already uses and
 * already has a test pinning its behaviour down — reusing it here instead of
 * a second hand-rolled version is one less place this exact bug can recur.
 */
async function onLeaveToday() {
  const today = toDate();
  const rows = await Leave.find(
    { status: "Approved", from: { $lte: today }, to: { $gte: today } },
    { name: 1, _id: 0 },
  ).lean();
  return rows.map((l) => l.name);
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const PERIODS = [
  "09:00 – 09:55",
  "10:00 – 10:55",
  "11:10 – 12:05",
  "12:10 – 13:05",
  "14:00 – 14:55",
];

/** Slot documents → the `timetable[day][periodIndex]` shape the grid renders. */
function toGrid(slots) {
  const grid = Object.fromEntries(DAYS.map((d) => [d, PERIODS.map(() => null)]));
  for (const slot of slots) {
    if (grid[slot.day] && slot.period < PERIODS.length) {
      grid[slot.day][slot.period] = {
        code: slot.code,
        room: slot.room,
        faculty: slot.faculty,
      };
    }
  }
  return grid;
}

/**
 * Reassigns the slots of unavailable teachers to a colleague free in that slot,
 * mirroring the rebuild the admin timetable page performs client-side.
 */
function restaff(grid, unavailable, availability) {
  const out = {};
  for (const day of DAYS) {
    out[day] = grid[day].map((slot, pi) => {
      if (!slot || !unavailable.includes(slot.faculty)) return slot;
      const tag = `${day} P${pi + 1}`;
      const sub = availability.find(
        (t) => (t.free ?? []).includes(tag) && !unavailable.includes(t.name),
      );
      return sub
        ? { ...slot, faculty: sub.name, substitute: true }
        : { ...slot, faculty: "Unstaffed", substitute: true };
    });
  }
  return out;
}

/** Rows for the "what changed" table under the grid. */
function changeList(grid) {
  return DAYS.flatMap((day) =>
    grid[day]
      .map((slot, pi) =>
        slot?.substitute
          ? {
              id: `${day}-${pi}`,
              day,
              period: PERIODS[pi],
              code: slot.code,
              room: slot.room,
              cover: slot.faculty,
              status: slot.faculty === "Unstaffed" ? "Needs cover" : "Reassigned",
            }
          : null,
      )
      .filter(Boolean),
  );
}

/**
 * GET /api/timetable?scope=master&unavailable=A,B
 * Returns days, periods and the grid — already re-staffed around anyone
 * unavailable (teachers on approved leave are included automatically).
 */
router.get(
  "/",
  route(async (req, res) => {
    const scope = req.query.scope || "master";
    const [slots, availability, onLeave] = await Promise.all([
      TimetableSlot.find({ scope }).lean(),
      Faculty.find({}, { name: 1, free: 1, _id: 0 }).sort({ name: 1 }).lean(),
      onLeaveToday(),
    ]);

    const requested = req.query.unavailable
      ? String(req.query.unavailable).split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const unavailable = [...new Set([...requested, ...onLeave])];

    const grid = restaff(toGrid(slots), unavailable, availability);
    const version = slots.reduce((max, s) => Math.max(max, s.version ?? 1), 1);

    res.json({
      days: DAYS,
      periods: PERIODS,
      scope,
      version,
      unavailable,
      timetable: grid,
      changes: changeList(grid),
      availability: availability.map((f) => ({ name: f.name, free: f.free ?? [] })),
    });
  }),
);

/**
 * POST /api/timetable/rebuild — the "Rebuild · v{n}" button.
 *
 * Only the version is persisted. Substitution stays a read-time computation so
 * the canonical assignment survives: when a teacher comes back off leave their
 * slots are theirs again, which overwriting `faculty` here would make impossible.
 */
router.post(
  "/rebuild",
  route(async (req, res) => {
    const scope = req.body?.scope || "master";
    const requested = Array.isArray(req.body?.unavailable) ? req.body.unavailable : [];

    const [slots, availability, onLeave] = await Promise.all([
      TimetableSlot.find({ scope }).lean(),
      Faculty.find({}, { name: 1, free: 1, _id: 0 }).sort({ name: 1 }).lean(),
      onLeaveToday(),
    ]);

    const unavailable = [...new Set([...requested, ...onLeave])];
    const grid = restaff(toGrid(slots), unavailable, availability);
    const version = slots.reduce((max, s) => Math.max(max, s.version ?? 1), 1) + 1;

    await TimetableSlot.updateMany({ scope }, { version });

    res.json({
      days: DAYS,
      periods: PERIODS,
      scope,
      version,
      unavailable,
      timetable: grid,
      changes: changeList(grid),
    });
  }),
);

/** PUT /api/timetable/slot — place or clear a single cell. */
router.put(
  "/slot",
  route(async (req, res) => {
    const { day, period, code, room, faculty, scope = "master" } = req.body ?? {};
    if (!DAYS.includes(day)) throw badRequest(`day must be one of ${DAYS.join(", ")}`);
    const index = Number(period);
    if (!Number.isInteger(index) || index < 0 || index >= PERIODS.length) {
      throw badRequest(`period must be an integer between 0 and ${PERIODS.length - 1}`);
    }

    if (!code) {
      await TimetableSlot.deleteOne({ scope, day, period: index });
      return res.json({ ok: true, cleared: true, day, period: index });
    }

    const row = await TimetableSlot.findOneAndUpdate(
      { scope, day, period: index },
      { code, room: room || "TBD", faculty: faculty || "Unassigned" },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    res.json(row);
  }),
);

module.exports = router;
module.exports.DAYS = DAYS;
module.exports.PERIODS = PERIODS;
