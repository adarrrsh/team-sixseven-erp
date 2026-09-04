const test = require("node:test");
const assert = require("node:assert/strict");

const { grade } = require("../lib/grade");
const { normaliseUid } = require("../lib/uid");
const { toDate } = require("../lib/attendance");

/* These are pure functions the whole system leans on, so they get pinned down. */

test("grade bands match the ones the score page renders", () => {
  assert.equal(grade(100), "A+");
  assert.equal(grade(90), "A+");
  assert.equal(grade(89), "A");
  assert.equal(grade(80), "A");
  assert.equal(grade(79), "B");
  assert.equal(grade(70), "B");
  assert.equal(grade(69), "C");
  assert.equal(grade(60), "C");
  assert.equal(grade(59), "D");
  assert.equal(grade(50), "D");
  assert.equal(grade(49), "E");
  assert.equal(grade(0), "E");
});

test("card UIDs normalise to one canonical form", () => {
  const canonical = "9CFE1A4A";
  for (const written of ["9C FE 1A 4A", "9c:fe:1a:4a", "9c-fe-1a-4a", " 9cfe1a4a ", "9CFE1A4A"]) {
    assert.equal(normaliseUid(written), canonical, `${written} should normalise to ${canonical}`);
  }
});

test("normalising a missing UID does not throw", () => {
  assert.equal(normaliseUid(undefined), "");
  assert.equal(normaliseUid(null), "");
});

test("toDate returns a local calendar day, and rejects nonsense", () => {
  assert.equal(toDate("2026-09-05T09:12:44+05:30"), "2026-09-05");
  assert.match(toDate(), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(toDate("not-a-time"), null);
});
