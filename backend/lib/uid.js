/**
 * Canonical form of an RFID UID.
 *
 * Readers report the same card in many shapes — "9C FE 1A 4A", "9C:FE:1A:4A",
 * "9c-fe-1a-4a", "9CFE1A4A" — so separators are stripped and the rest
 * upper-cased. Every card is stored and looked up through this, which means a
 * card registered in one format still matches a scan sent in another.
 */
function normaliseUid(value) {
  return String(value ?? "").replace(/[^0-9A-Za-z]/g, "").toUpperCase();
}

module.exports = { normaliseUid };
