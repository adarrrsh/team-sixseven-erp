const express = require("express");
const Card = require("../models/Card");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const { normaliseUid } = require("../lib/uid");
const { route, badRequest, HttpError, contains } = require("../lib/http");
const { syncPercentage, toDate, modelFor } = require("../lib/attendance");

const router = express.Router();

/**
 * Readers are unattended devices on the campus network, so when
 * RFID_DEVICE_KEY is configured every scan must carry it as `x-device-key`.
 * Left unset (development), scans are accepted unauthenticated.
 */
function authoriseReader(req) {
  const expected = process.env.RFID_DEVICE_KEY;
  if (!expected) return;
  if (req.get("x-device-key") !== expected) {
    throw new HttpError(401, "Invalid or missing reader key");
  }
}

/**
 * POST /api/attendance/rfid — the endpoint the card readers post to.
 *
 * Body: { cardId, scannedAt?, reader? }
 *   cardId    the UID read off the card
 *   scannedAt device clock, ISO 8601 (defaults to server time)
 *   reader    optional identifier of the gate or classroom
 *
 * Matches the card against the register and marks its holder present for that
 * day. Re-tapping the same card that day is idempotent: it updates `lastSeen`
 * and the scan count, and never marks a second day.
 */
router.post(
  "/rfid",
  route(async (req, res) => {
    authoriseReader(req);

    const { cardId, scannedAt, reader } = req.body ?? {};
    if (!cardId) throw badRequest("cardId is required");

    const uid = normaliseUid(cardId);
    const card = await Card.findOne({ cardId: uid });
    if (!card) throw new HttpError(404, `Card ${uid} is not registered`);
    if (card.status !== "Active") {
      throw new HttpError(403, `Card ${uid} is ${card.status.toLowerCase()} and cannot be used`);
    }

    // The device supplies the moment of the tap; the server records when it arrived.
    const date = toDate(scannedAt);
    if (!date) throw badRequest("scannedAt must be a valid ISO 8601 date-time");
    const seenAt = scannedAt ? new Date(scannedAt).toISOString() : new Date().toISOString();
    const recordedAt = new Date().toISOString();

    const holder = await modelFor(card.holderType).findOne({ id: card.holderId });
    if (!holder) throw new HttpError(404, `Card ${uid} is issued to an unknown holder`);

    const existing = await Attendance.findOne({
      holderType: card.holderType,
      holderId: card.holderId,
      date,
    });

    let record;
    let alreadyPresent = false;

    if (existing) {
      alreadyPresent = existing.status === "Present";
      existing.status = "Present";
      existing.lastSeen = seenAt;
      existing.recordedAt = recordedAt;
      existing.scans += 1;
      existing.cardId = uid;
      if (reader) existing.reader = reader;
      if (!existing.firstSeen) existing.firstSeen = seenAt;
      record = await existing.save();
    } else {
      record = await Attendance.create({
        holderType: card.holderType,
        holderId: card.holderId,
        name: holder.name,
        dept: holder.dept,
        date,
        status: "Present",
        firstSeen: seenAt,
        lastSeen: seenAt,
        recordedAt,
        scans: 1,
        cardId: uid,
        reader: reader || "",
        source: "rfid",
      });
    }

    card.lastSeenAt = seenAt;
    await card.save();

    const totals = await syncPercentage(card.holderType, card.holderId);

    res.status(alreadyPresent ? 200 : 201).json({
      ok: true,
      alreadyPresent,
      marked: alreadyPresent ? "already present today" : "Present",
      holder: {
        type: card.holderType,
        id: holder.id,
        name: holder.name,
        dept: holder.dept,
        attendance: totals?.percentage ?? holder.attendance,
      },
      date,
      firstSeen: record.firstSeen,
      lastSeen: record.lastSeen,
      scans: record.scans,
      reader: record.reader || null,
    });
  }),
);

/** GET /api/attendance?date=&holderType=&holderId=&status=&q= — the day register. */
router.get(
  "/",
  route(async (req, res) => {
    const { date, holderType, holderId, status, q } = req.query;
    const filter = {};
    if (date) filter.date = date;
    if (holderType) filter.holderType = holderType;
    if (holderId) filter.holderId = holderId;
    if (status) filter.status = status;
    if (q) filter.$or = [{ name: contains(q) }, { holderId: contains(q) }, { cardId: contains(q) }];

    res.json(await Attendance.find(filter).sort({ date: -1, name: 1 }));
  }),
);

/** GET /api/attendance/today — everyone seen so far today. */
router.get(
  "/today",
  route(async (_req, res) => {
    const date = toDate();
    const rows = await Attendance.find({ date }).sort({ name: 1 });
    res.json({
      date,
      present: rows.filter((r) => r.status === "Present").length,
      absent: rows.filter((r) => r.status === "Absent").length,
      rows,
    });
  }),
);

/**
 * POST /api/attendance/close-day — end-of-day roll.
 *
 * Everyone who never tapped in is marked Absent for that date, which is what
 * turns the register into a meaningful percentage.
 */
router.post(
  "/close-day",
  route(async (req, res) => {
    const date = toDate(req.body?.date);
    if (!date) throw badRequest("date must be a valid date");
    const holderType = req.body?.holderType ?? "student";
    if (!["student", "faculty"].includes(holderType)) {
      throw badRequest("holderType must be student or faculty");
    }

    const people = await modelFor(holderType).find({ status: { $ne: "Inactive" } }).lean();
    const seen = await Attendance.find({ date, holderType }, { holderId: 1, _id: 0 }).lean();
    const seenIds = new Set(seen.map((r) => r.holderId));

    const missing = people.filter((p) => !seenIds.has(p.id));
    if (missing.length) {
      await Attendance.insertMany(
        missing.map((p) => ({
          holderType,
          holderId: p.id,
          name: p.name,
          dept: p.dept,
          date,
          status: "Absent",
          scans: 0,
          source: "manual",
          recordedAt: new Date().toISOString(),
        })),
      );
    }

    await Promise.all(people.map((p) => syncPercentage(holderType, p.id)));

    res.json({
      ok: true,
      date,
      holderType,
      markedAbsent: missing.length,
      present: people.length - missing.length,
    });
  }),
);

/** PATCH /api/attendance/:holderId — manual correction for one person and day. */
router.patch(
  "/:holderId",
  route(async (req, res) => {
    const { date, status, holderType = "student" } = req.body ?? {};
    if (!["Present", "Absent"].includes(status)) {
      throw badRequest("status must be Present or Absent");
    }
    const day = toDate(date);
    if (!day) throw badRequest("date must be a valid date");

    const holder = await modelFor(holderType).findOne({ id: req.params.holderId });
    if (!holder) throw new HttpError(404, "Holder not found");

    const record = await Attendance.findOneAndUpdate(
      { holderType, holderId: req.params.holderId, date: day },
      {
        holderType,
        holderId: req.params.holderId,
        name: holder.name,
        dept: holder.dept,
        date: day,
        status,
        source: "manual",
        recordedAt: new Date().toISOString(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    const totals = await syncPercentage(holderType, req.params.holderId);
    res.json({ ...record.toJSON(), attendance: totals?.percentage });
  }),
);

module.exports = router;
