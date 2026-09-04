const mongoose = require("mongoose");
const { schema } = require("../lib/schema");

const SalarySchema = schema({
  id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  dept: { type: String, default: "—" },
  gross: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  net: { type: Number, default: 0 },
  month: { type: String, required: true },
  status: { type: String, enum: ["Paid", "Processing", "Hold"], default: "Processing" },
});

SalarySchema.index({ id: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("Salary", SalarySchema);
