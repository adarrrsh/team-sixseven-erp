const mongoose = require("mongoose");
const { schema } = require("../lib/schema");

const ScoreSchema = schema({
  id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  program: { type: String, required: true },
  exam: { type: String, required: true },
  course: { type: String, required: true, index: true },
  marks: { type: Number, default: 0, min: 0 },
  max: { type: Number, default: 100 },
  grade: { type: String, default: "—" },
});

/** A student holds one score per course per exam. */
ScoreSchema.index({ id: 1, course: 1, exam: 1 }, { unique: true });

module.exports = mongoose.model("Score", ScoreSchema);
