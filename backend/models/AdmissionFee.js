const mongoose = require("mongoose");
const { schema } = require("../lib/schema");

const AdmissionFeeSchema = schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  program: { type: String, required: true },
  payable: { type: Number, default: 0 },
  paid: { type: Number, default: 0 },
  mode: { type: String, default: "—" },
  ref: { type: String, default: "—" },
  status: { type: String, enum: ["Paid", "Partial", "Unpaid"], default: "Unpaid" },
});

module.exports = mongoose.model("AdmissionFee", AdmissionFeeSchema);
