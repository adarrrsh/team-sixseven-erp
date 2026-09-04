const express = require("express");
const TimetableSlot = require("../models/TimetableSlot");
const Faculty = require("../models/Faculty");
const { route, badRequest } = require("../lib/http");

const router = express.Router();

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
      Faculty.find({ status: "On leave" }, { name: 1, _id: 0 }).lean(),
    ]);

    const requested = req.query.unavailable
      ? String(req.query.unavailable).split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const unavailable = [...new Set([...requested, ...onLeave.map((f) => f.name)])];

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
      Faculty.find({ status: "On leave" }, { name: 1, _id: 0 }).lean(),
    ]);

    const unavailable = [...new Set([...requested, ...onLeave.map((f) => f.name)])];
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
