const mongoose = require("mongoose");
const { schema } = require("../lib/schema");

const StudentFeeSchema = schema({
  id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  program: { type: String, required: true },
  head: { type: String, required: true },
  payable: { type: Number, default: 0 },
  paid: { type: Number, default: 0 },
  due: { type: String, required: true },
  status: { type: String, enum: ["Paid", "Partial", "Overdue", "Pending"], default: "Pending" },
});

StudentFeeSchema.index({ id: 1, head: 1 }, { unique: true });

module.exports = mongoose.model("StudentFee", StudentFeeSchema);
