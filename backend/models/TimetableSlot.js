const mongoose = require("mongoose");
const { schema } = require("../lib/schema");

const TimetableSlotSchema = schema({
  day: { type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri"], required: true, index: true },
  period: { type: Number, required: true, min: 0 },
  code: { type: String, required: true },
  room: { type: String, default: "TBD" },
  faculty: { type: String, default: "Unassigned" },
  scope: { type: String, default: "master", index: true },
  version: { type: Number, default: 1 },
});

TimetableSlotSchema.index({ scope: 1, day: 1, period: 1 }, { unique: true });

module.exports = mongoose.model("TimetableSlot", TimetableSlotSchema);
