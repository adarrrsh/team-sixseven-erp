const test = require("node:test");
const assert = require("node:assert/strict");

const connectDB = require("../db/connection");
const { disconnectDB } = require("../db/connection");
const { checkConsistency } = require("../lib/consistency");

test("database consistency", async (t) => {
  await connectDB();
  const issues = await checkConsistency();
  const of = (kind) => issues.filter((i) => i.kind === kind).map((i) => i.detail);
  const report = (list) => "\n  - " + list.join("\n  - ");

  await t.test("stored attendance percentages match the register", () => {
    const bad = of("attendance");
    assert.equal(bad.length, 0, `stored percentage has drifted from the register:${report(bad)}`);
  });

  await t.test("faculty On-leave status matches an approved, in-range leave", () => {
    const bad = of("facultyLeaveStatus");
    assert.equal(bad.length, 0, `status disagrees with the leave record:${report(bad)}`);
  });

  await t.test("student fee balances match their fee heads", () => {
    const bad = of("feesDue");
    assert.equal(bad.length, 0, `feesDue disagrees with the fee heads:${report(bad)}`);
  });

  await t.test("student fine totals match unsettled fines", () => {
    const bad = of("fines");
    assert.equal(bad.length, 0, `fines total disagrees with the fine records:${report(bad)}`);
  });

  await t.test("paid admissions have a tracker row and an enrolled student", () => {
    const bad = of("admissionFee");
    assert.equal(bad.length, 0, `admission fee state is inconsistent:${report(bad)}`);
  });

  await t.test("every grade matches its marks", () => {
    const bad = of("grade");
    assert.equal(bad.length, 0, `grade does not match marks:${report(bad)}`);
  });

  await t.test("no record points at something that is not there", () => {
    const bad = of("orphan");
    assert.equal(bad.length, 0, `dangling references:${report(bad)}`);
  });

  await t.test("nobody holds two active cards", () => {
    const bad = of("duplicateCard");
    assert.equal(bad.length, 0, `duplicate active cards:${report(bad)}`);
  });

  await disconnectDB();
});
