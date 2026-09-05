const mongoose = require("mongoose");
const { schema } = require("../lib/schema");

/**
 * A conversation the chatbot could not finish, handed to a person.
 *
 * The transcript is carried over so whoever picks it up can see what was
 * already asked and answered rather than starting the visitor from scratch.
 */
const SupportRequestSchema = schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: "Visitor" },
  email: { type: String, default: "", index: true },
  /** What the visitor was asking when the bot gave up. */
  question: { type: String, required: true },
  transcript: {
    type: [{ from: { type: String, enum: ["bot", "user", "admin"] }, text: String, at: String }],
    default: [],
  },
  status: {
    type: String,
    enum: ["Open", "Claimed", "Resolved"],
    default: "Open",
    index: true,
  },
  claimedBy: { type: String, default: "" },
  /** Where the visitor was when they asked — login page, portal, and so on. */
  source: { type: String, default: "login" },
  raisedAt: { type: String, default: () => new Date().toISOString() },
  resolvedAt: { type: String, default: "" },
});

module.exports = mongoose.model("SupportRequest", SupportRequestSchema);
