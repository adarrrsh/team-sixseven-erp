const crypto = require("crypto");

const WORDS = ["origin", "campus", "scholar", "quad", "atrium", "lyceum", "beacon", "cadence"];

function generatePassword() {
  const word = WORDS[crypto.randomInt(WORDS.length)];
  const digits = String(crypto.randomInt(1000, 10000));
  const letter = "abcdefghijkmnpqrstuvwxyz"[crypto.randomInt(24)];
  return `${word}-${digits}-${letter}`;
}

module.exports = { generatePassword };
