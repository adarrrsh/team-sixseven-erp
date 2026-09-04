const Student = require("../models/Student");
const User = require("../models/User");
const { nextId } = require("./http");
const { generatePassword } = require("./credentials");

/** Programmes map onto the department the admitted student joins. */
const PROGRAM_DEPT = {
  "B.Tech CSE": "Computer Science",
  "B.Tech ECE": "Electronics",
  "B.Tech MECH": "Mechanical",
  "B.Com Hons": "Commerce",
};

/** An institute address in the house style — "aisha.s@origin.edu" — kept unique. */
async function instituteEmail(name) {
  const [first = "student", last = ""] = String(name).toLowerCase().split(/\s+/);
  const base = last ? `${first}.${last[0]}` : first;

  for (let n = 0; ; n += 1) {
    const candidate = `${base}${n || ""}@origin.edu`;
    if (!(await User.findOne({ email: candidate }))) return candidate;
  }
}

/**
 * Turns a paid admission into a student on the roll, with a login.
 *
 * The single place a seat becomes a student — used when the fee clears, and
 * again when reconciling an admission that was marked paid without one. Doing
 * it in two places is how the two ever disagreed.
 */
async function enrolFromAdmission(admission) {
  if (admission.studentId) {
    const existing = await Student.findOne({ id: admission.studentId });
    if (existing) return { studentId: existing.id, email: existing.email, password: null, already: true };
  }

  const studentId = await nextId(Student, "ST-", 8801);
  const password = generatePassword();
  const email = await instituteEmail(admission.name);

  await Student.create({
    id: studentId,
    name: admission.name,
    program: admission.program,
    sem: 1,
    dept: PROGRAM_DEPT[admission.program] ?? "Computer Science",
    email,
    phone: admission.phone,
    guardian: "—",
    status: "Active",
  });

  await User.create({ email, password, name: admission.name, role: "student", linkedId: studentId });

  return { studentId, email, password, already: false };
}

module.exports = { enrolFromAdmission, instituteEmail, PROGRAM_DEPT };
