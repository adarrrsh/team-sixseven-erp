const mongoose = require("mongoose");
const { schema } = require("../lib/schema");

const PaymentSchema = schema({
  reference: { type: String, required: true, unique: true, index: true },
  kind: { type: String, enum: ["admission", "student"], required: true, index: true },
  applicationId: { type: String, default: "" },
  studentId: { type: String, default: "" },
  name: { type: String, default: "" },
  email: { type: String, default: "" },
  program: { type: String, default: "" },
  head: { type: String, default: "" },
  amount: { type: Number, required: true, min: 0 },
  mode: { type: String, default: "Card" },
  status: { type: String, enum: ["Success", "Failed"], default: "Success" },
  paidAt: { type: String, required: true },
});

module.exports = mongoose.model("Payment", PaymentSchema);
