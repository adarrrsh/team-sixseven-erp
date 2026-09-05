const mongoose = require("mongoose");
const { schema } = require("../lib/schema");

const AdmissionSchema = schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  program: { type: String, required: true },
  score: { type: Number, default: 0 },
  applied: { type: String, required: true },
  fee: { type: Number, default: 0 },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending", index: true },
  email: { type: String, default: "—", index: true },
  phone: { type: String, default: "—" },

  dob: { type: String, default: "" },
  board: { type: String, default: "" },
  statement: { type: String, default: "" },

  feeStatus: { type: String, enum: ["Unpaid", "Paid"], default: "Unpaid", index: true },
  paidAt: { type: String, default: "" },
  paymentRef: { type: String, default: "" },

  studentId: { type: String, default: "" },
  decidedAt: { type: String, default: "" },
});

module.exports = mongoose.model("Admission", AdmissionSchema);
