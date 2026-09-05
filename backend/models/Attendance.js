const mongoose = require("mongoose");
const { schema } = require("../lib/schema");

const AttendanceSchema = schema({
  holderType: { type: String, enum: ["student", "faculty"], required: true, index: true },
  holderId: { type: String, required: true, index: true },
  name: { type: String, default: "" },
  dept: { type: String, default: "" },
  date: { type: String, required: true, index: true },
  status: { type: String, enum: ["Present", "Absent"], default: "Present", index: true },

  firstSeen: { type: String, default: "" },
  lastSeen: { type: String, default: "" },
  recordedAt: { type: String, default: "" },

  scans: { type: Number, default: 0 },
  cardId: { type: String, default: "" },
  reader: { type: String, default: "" },
  source: { type: String, enum: ["rfid", "manual"], default: "rfid" },
});

AttendanceSchema.index({ holderType: 1, holderId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);
