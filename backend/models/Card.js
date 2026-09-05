const mongoose = require("mongoose");
const { schema } = require("../lib/schema");
const { normaliseUid } = require("../lib/uid");

const CardSchema = schema({
  cardId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    set: normaliseUid,
  },
  holderType: { type: String, enum: ["student", "faculty"], required: true },
  holderId: { type: String, required: true, index: true },
  holderName: { type: String, default: "" },
  status: { type: String, enum: ["Active", "Lost", "Deactivated"], default: "Active", index: true },
  issuedAt: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  lastSeenAt: { type: String, default: "" },
});

CardSchema.index({ holderType: 1, holderId: 1 });

module.exports = mongoose.model("Card", CardSchema);
