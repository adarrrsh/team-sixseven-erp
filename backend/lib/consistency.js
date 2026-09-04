const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Attendance = require("../models/Attendance");
const StudentFee = require("../models/StudentFee");
const Fine = require("../models/Fine");
const Admission = require("../models/Admission");
const AdmissionFee = require("../models/AdmissionFee");
const Score = require("../models/Score");
const Card = require("../models/Card");
const User = require("../models/User");
const { grade } = require("./grade");

/**
 * Checks every denormalised field against the records it is derived from.
 *
 * Several figures are stored on the parent document for the dashboards to read
 * cheaply — a student's attendance percentage, their outstanding fees, their
 * unpaid fines. Each one can drift from its source, and a drifted value is what
 * shows up as two screens disagreeing about the same student. Returns a flat
 * list of findings; empty means the database is internally consistent.
 */
async function checkConsistency() {
  const issues = [];
  const flag = (kind, detail) => issues.push({ kind, detail });

  const [students, faculty, attendance, fees, fines, admissions, admFees, scores, cards, users] =
    await Promise.all([
      Student.find().lean(),
      Faculty.find().lean(),
      Attendance.find().lean(),
      StudentFee.find().lean(),
      Fine.find().lean(),
      Admission.find().lean(),
      AdmissionFee.find().lean(),
      Score.find().lean(),
      Card.find().lean(),
      User.find().lean(),
    ]);

  const fromRegister = (holderType, id) => {
    const rows = attendance.filter((a) => a.holderType === holderType && a.holderId === id);
    if (!rows.length) return null;
    const present = rows.filter((r) => r.status === "Present").length;
    return { percentage: Math.round((present / rows.length) * 100), present, days: rows.length };
  };

  /* --- stored attendance percentage must equal the register --- */
  for (const [people, type] of [[students, "student"], [faculty, "faculty"]]) {
    for (const person of people) {
      const derived = fromRegister(type, person.id);
      if (derived && derived.percentage !== person.attendance) {
        flag(
          "attendance",
          `${person.id} ${person.name}: stored ${person.attendance}% vs register ${derived.percentage}% (${derived.present}/${derived.days})`,
        );
      }
    }
  }

  /* --- a student's balances must equal their fee heads and unpaid fines --- */
  for (const s of students) {
    const owed = fees.filter((f) => f.id === s.id).reduce((n, f) => n + (f.payable - f.paid), 0);
    if (owed !== s.feesDue) flag("feesDue", `${s.id} ${s.name}: stored ₹${s.feesDue} vs heads ₹${owed}`);

    const unpaid = fines
      .filter((f) => (f.studentId === s.id || f.student === s.name) && f.status === "Unpaid")
      .reduce((n, f) => n + f.amount, 0);
    if (unpaid !== s.fines) flag("fines", `${s.id} ${s.name}: stored ₹${s.fines} vs unpaid ₹${unpaid}`);
  }

  /* --- a paid admission must have a tracker row and an issued student --- */
  for (const a of admissions) {
    if (a.feeStatus !== "Paid") continue;
    const row = admFees.find((f) => f.id === a.id);
    if (!row) flag("admissionFee", `${a.id} ${a.name}: marked Paid but has no fee-tracker row`);
    else if (row.paid < row.payable)
      flag("admissionFee", `${a.id} ${a.name}: marked Paid but tracker shows ₹${row.paid} of ₹${row.payable}`);
    if (!a.studentId) flag("admissionFee", `${a.id} ${a.name}: seat paid for but no student was enrolled`);
  }

  /* --- grades are a pure function of marks --- */
  for (const s of scores) {
    if (s.grade !== grade(s.marks))
      flag("grade", `${s.id} ${s.course}: ${s.marks} marks graded ${s.grade}, expected ${grade(s.marks)}`);
  }

  /* --- nothing may reference a record that is not there --- */
  const has = (pool, id) => pool.some((p) => p.id === id);
  for (const s of scores) if (!has(students, s.id)) flag("orphan", `score for unknown student ${s.id} (${s.course})`);
  for (const a of admissions)
    if (a.studentId && !has(students, a.studentId)) flag("orphan", `${a.id}: studentId ${a.studentId} not on the roll`);
  for (const c of cards)
    if (!has(c.holderType === "faculty" ? faculty : students, c.holderId))
      flag("orphan", `card ${c.cardId} -> missing ${c.holderType} ${c.holderId}`);
  for (const a of attendance)
    if (!has(a.holderType === "faculty" ? faculty : students, a.holderId))
      flag("orphan", `attendance ${a.date} -> missing ${a.holderType} ${a.holderId}`);
  for (const u of users) {
    if (u.role === "student" && u.linkedId && !has(students, u.linkedId))
      flag("orphan", `user ${u.email} -> missing student ${u.linkedId}`);
    if (u.role === "faculty" && u.linkedId && !has(faculty, u.linkedId))
      flag("orphan", `user ${u.email} -> missing faculty ${u.linkedId}`);
  }

  /* --- one active card per holder, or either tap marks them present --- */
  const activeByHolder = {};
  for (const c of cards.filter((c) => c.status === "Active")) {
    (activeByHolder[`${c.holderType}:${c.holderId}`] ??= []).push(c.cardId);
  }
  for (const [holder, list] of Object.entries(activeByHolder)) {
    if (list.length > 1) flag("duplicateCard", `${holder} has ${list.length} active cards: ${list.join(", ")}`);
  }

  return issues;
}

module.exports = { checkConsistency };
