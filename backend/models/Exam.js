const mongoose = require("mongoose");
const { schema } = require("../lib/schema");

const ExamSchema = schema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  program: { type: String, required: true },
  date: { type: String, required: true },
  slot: { type: String, default: "09:30 – 12:30" },
  room: { type: String, default: "TBD" },
  invigilator: { type: String, default: "Unassigned" },
  students: { type: Number, default: 0 },
  status: { type: String, enum: ["Draft", "Scheduled", "Completed", "Cancelled"], default: "Draft", index: true },
});

module.exports = mongoose.model("Exam", ExamSchema);
