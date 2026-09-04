const mongoose = require("mongoose");
const { schema } = require("../lib/schema");
const { normaliseUid } = require("../lib/uid");

/**
 * An RFID card issued to a student or a teacher.
 *
 * `cardId` is the UID the reader transmits, stored in canonical form (see
 * lib/uid) so "9C FE 1A 4A", "9c:fe:1a:4a" and "9CFE1A4A" are one card.
 */
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
  /** A lost card is deactivated rather than deleted, so its scans stay auditable. */
  status: { type: String, enum: ["Active", "Lost", "Deactivated"], default: "Active", index: true },
  issuedAt: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  lastSeenAt: { type: String, default: "" },
});

CardSchema.index({ holderType: 1, holderId: 1 });

module.exports = mongoose.model("Card", CardSchema);
