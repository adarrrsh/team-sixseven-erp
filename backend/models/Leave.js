const mongoose = require("mongoose");
const { schema } = require("../lib/schema");

const LeaveSchema = schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  dept: { type: String, default: "—" },
  type: { type: String, default: "Casual" },
  from: { type: String, required: true },
  to: { type: String, required: true },
  days: { type: Number, default: 1 },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending", index: true },
  cover: { type: String, default: "—" },
  reason: { type: String, default: "" },
});

module.exports = mongoose.model("Leave", LeaveSchema);
