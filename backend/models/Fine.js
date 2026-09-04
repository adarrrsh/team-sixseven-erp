const mongoose = require("mongoose");
const { schema } = require("../lib/schema");

const FineSchema = schema({
  id: { type: String, required: true, unique: true, index: true },
  student: { type: String, required: true, index: true },
  studentId: { type: String, default: "" },
  reason: { type: String, required: true },
  amount: { type: Number, default: 0 },
  raised: { type: String, required: true },
  status: { type: String, enum: ["Paid", "Unpaid", "Waived"], default: "Unpaid" },
});

module.exports = mongoose.model("Fine", FineSchema);
