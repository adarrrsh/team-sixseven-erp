const mongoose = require("mongoose");
const { schema } = require("../lib/schema");

const FacultySchema = schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  dept: { type: String, required: true, index: true },
  subject: { type: String, default: "—" },
  email: { type: String, default: "—" },
  phone: { type: String, default: "—" },
  exp: { type: Number, default: 0 },
  salary: { type: Number, default: 0 },
  attendance: { type: Number, default: 100 },
  load: { type: Number, default: 0 },
  status: { type: String, enum: ["Active", "On leave", "Inactive"], default: "Active" },
  free: { type: [String], default: [] },
});

module.exports = mongoose.model("Faculty", FacultySchema);
