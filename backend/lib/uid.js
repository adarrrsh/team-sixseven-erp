function normaliseUid(value) {
  return String(value ?? "").replace(/[^0-9A-Za-z]/g, "").toUpperCase();
}

module.exports = { normaliseUid };
