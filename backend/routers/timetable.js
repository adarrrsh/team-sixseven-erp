const express = require("express");
const TimetableSlot = require("../models/TimetableSlot");
const Faculty = require("../models/Faculty");
const Leave = require("../models/Leave");
const { toDate } = require("../lib/attendance");
const { route, badRequest } = require("../lib/http");

const router = express.Router();

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
