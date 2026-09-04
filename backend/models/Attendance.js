const mongoose = require("mongoose");
const { schema } = require("../lib/schema");

/**
 * One attendance record per person per day.
 *
 * A card scan creates the day's record as Present; further scans that day only
 * move `lastSeen`, so tapping in twice cannot count twice.
 */
const AttendanceSchema = schema({
  holderType: { type: String, enum: ["student", "faculty"], required: true, index: true },
  holderId: { type: String, required: true, index: true },
  name: { type: String, default: "" },
  dept: { type: String, default: "" },
  /** Local calendar date, YYYY-MM-DD — the unit the registers are kept in. */
  date: { type: String, required: true, index: true },
  status: { type: String, enum: ["Present", "Absent"], default: "Present", index: true },

  /** Device clock, as transmitted by the reader. */
  firstSeen: { type: String, default: "" },
  lastSeen: { type: String, default: "" },
  /** Server clock at the moment the scan arrived — readers drift, so keep both. */
  recordedAt: { type: String, default: "" },

  scans: { type: Number, default: 0 },
  cardId: { type: String, default: "" },
  reader: { type: String, default: "" },
  source: { type: String, enum: ["rfid", "manual"], default: "rfid" },
});

/** One row per person per day. */
AttendanceSchema.index({ holderType: 1, holderId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);
