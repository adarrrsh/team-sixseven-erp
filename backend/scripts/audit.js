/**
 * Prints every consistency finding. `npm run audit`
 * Add --fix to realign stored attendance percentages with the register.
 */
const connectDB = require("../db/connection");
const { disconnectDB } = require("../db/connection");
const { checkConsistency } = require("../lib/consistency");
const { reconcileAll } = require("../lib/attendance");
const { enrolFromAdmission } = require("../lib/enrolment");
const Admission = require("../models/Admission");

(async () => {
  await connectDB();

  if (process.argv.includes("--fix")) {
    const changed = await reconcileAll();
    console.log(`Reconciled ${changed.length} attendance percentage(s)`);
    changed.forEach((c) => console.log(`   ${c.holderId} ${c.name}: ${c.from}% -> ${c.to}%`));

    // A seat marked paid must have a student behind it.
    const unissued = await Admission.find({ feeStatus: "Paid", studentId: "" });
    for (const admission of unissued) {
      const { studentId, email, password } = await enrolFromAdmission(admission);
      admission.studentId = studentId;
      await admission.save();
      console.log(`Enrolled ${admission.id} ${admission.name} -> ${studentId}`);
      console.log(`   login ${email} / ${password}   (shown once)`);
    }
    console.log("");
  }

  const issues = await checkConsistency();
  const byKind = issues.reduce((m, i) => ((m[i.kind] ??= []).push(i.detail), m), {});
  for (const [kind, list] of Object.entries(byKind)) {
    console.log(`${kind} (${list.length})`);
    list.forEach((d) => console.log("   " + d));
    console.log("");
  }
  console.log(issues.length ? `${issues.length} inconsistencies` : "No inconsistencies found.");

  await disconnectDB();
  process.exit(issues.length ? 1 : 0);
})();
