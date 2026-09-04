const test = require("node:test");
const assert = require("node:assert/strict");

const BASE = process.env.TEST_API_BASE ?? "http://localhost:8000";

/**
 * Contract tests against a running server. Every case here is read-only or a
 * rejected write, so running the suite never alters the register.
 *
 * Skipped automatically when nothing is listening, so `npm test` still works
 * without a server up.
 */
const reachable = () =>
  fetch(`${BASE}/api/students`, { signal: AbortSignal.timeout(1500) })
    .then((r) => r.ok)
    .catch(() => false);

test("attendance API contract", async (t) => {
  if (!(await reachable())) {
    t.skip(`no server listening on ${BASE}`);
    return;
  }

  const post = (path, body, headers) =>
    fetch(BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });

  await t.test("a scan without a cardId is rejected", async () => {
    const res = await post("/api/attendance/rfid", { reader: "GATE-A" });
    assert.equal(res.status, 400);
    assert.match((await res.json()).error, /cardId is required/);
  });

  await t.test("an unregistered card is rejected, not silently marked", async () => {
    const res = await post("/api/attendance/rfid", { cardId: "DEADBEEFCAFE" });
    assert.equal(res.status, 404);
    assert.match((await res.json()).error, /not registered/);
  });

  await t.test("an unparseable timestamp is rejected", async () => {
    const cards = await (await fetch(`${BASE}/api/cards?status=Active`)).json();
    assert.ok(cards.length > 0, "expected at least one active card to test with");
    const res = await post("/api/attendance/rfid", {
      cardId: cards[0].cardId,
      scannedAt: "not-a-time",
    });
    assert.equal(res.status, 400);
    assert.match((await res.json()).error, /ISO 8601/);
  });

  await t.test("the register and the summary agree on every percentage", async () => {
    const summary = await (await fetch(`${BASE}/api/attendance/summary?holderType=student`)).json();
    const students = await (await fetch(`${BASE}/api/students`)).json();

    for (const row of summary) {
      const student = students.find((s) => s.id === row.holderId);
      if (!student) continue;
      assert.equal(
        student.attendance,
        row.percentage,
        `${row.holderId} ${row.name}: /students says ${student.attendance}%, /attendance/summary says ${row.percentage}%`,
      );
    }
  });

  await t.test("summary totals add up", async () => {
    const summary = await (await fetch(`${BASE}/api/attendance/summary?holderType=student`)).json();
    for (const row of summary) {
      assert.equal(row.present + row.absent, row.days, `${row.holderId}: present + absent != days`);
      assert.equal(
        row.percentage,
        Math.round((row.present / row.days) * 100),
        `${row.holderId}: percentage does not match present/days`,
      );
    }
  });

  await t.test("a student's history matches their summary row", async () => {
    const summary = await (await fetch(`${BASE}/api/attendance/summary?holderType=student`)).json();
    if (!summary.length) return;
    const row = summary[0];
    const history = await (await fetch(`${BASE}/api/attendance/history/${row.holderId}`)).json();

    assert.equal(history.days, row.days);
    assert.equal(history.present, row.present);
    assert.equal(history.percentage, row.percentage);
    assert.equal(history.eligible, row.percentage >= 75);
  });
});
