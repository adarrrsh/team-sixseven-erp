const mongoose = require("mongoose");
const { schema } = require("../lib/schema");

const StudentSchema = schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  program: { type: String, required: true },
  sem: { type: Number, default: 1 },
  dept: { type: String, required: true, index: true },
  attendance: { type: Number, default: 100 },
  cgpa: { type: Number, default: 0 },
  feesDue: { type: Number, default: 0 },
  fines: { type: Number, default: 0 },
  email: { type: String, default: "—" },
  phone: { type: String, default: "—" },
  guardian: { type: String, default: "—" },
  status: { type: String, enum: ["Active", "Probation", "Alumni", "Inactive"], default: "Active" },
});

module.exports = mongoose.model("Student", StudentSchema);
