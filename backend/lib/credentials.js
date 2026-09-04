const crypto = require("crypto");

const WORDS = ["origin", "campus", "scholar", "quad", "atrium", "lyceum", "beacon", "cadence"];

/**
 * A readable one-off password for a newly admitted student — a word, four
 * digits and a letter (e.g. "campus-4820-k"). Random enough for a demo issue,
 * and easy to read off a confirmation screen without mistyping.
 */
function generatePassword() {
  const word = WORDS[crypto.randomInt(WORDS.length)];
  const digits = String(crypto.randomInt(1000, 10000));
  const letter = "abcdefghijkmnpqrstuvwxyz"[crypto.randomInt(24)];
  return `${word}-${digits}-${letter}`;
}

module.exports = { generatePassword };
