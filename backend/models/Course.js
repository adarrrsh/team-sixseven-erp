const mongoose = require("mongoose");
const { schema } = require("../lib/schema");

const CourseSchema = schema({
  code: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  dept: { type: String, required: true, index: true },
  credits: { type: Number, default: 3 },
  faculty: { type: String, default: "Unassigned" },
  enrolled: { type: Number, default: 0 },
  sem: { type: Number, default: 1 },
});

module.exports = mongoose.model("Course", CourseSchema);
