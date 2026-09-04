const express = require("express");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const Admission = require("../models/Admission");
const AdmissionFee = require("../models/AdmissionFee");
const Student = require("../models/Student");
const StudentFee = require("../models/StudentFee");
const Fine = require("../models/Fine");
const User = require("../models/User");
const { route, badRequest, HttpError, nextId } = require("../lib/http");
const { generatePassword } = require("../lib/credentials");

const router = express.Router();

const reference = () =>
  "PAY-" + crypto.randomBytes(4).toString("hex").slice(0, 5).toUpperCase();

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
 * POST /api/payments/admission — the seat fee for an approved application.
 *
 * Payment is refused until the registrar has approved, and is idempotent once
 * paid. Clearing the fee confirms the seat: it enrols the student, issues a
 * randomly generated login, and records the id back on the application.
 */
router.post(
  "/admission",
  route(async (req, res) => {
    const { applicationId, email, amount } = req.body ?? {};
    if (!applicationId && !email) {
      throw badRequest("applicationId or email is required");
    }

    const admission = await Admission.findOne(
      applicationId
        ? { id: applicationId }
        : { email: String(email).toLowerCase().trim() },
    );
    if (!admission) throw new HttpError(404, "Application not found");

    if (admission.status !== "Approved") {
      throw badRequest(
        admission.status === "Rejected"
          ? "This application was rejected — no fee is payable"
          : "This application is still under review — the fee is not payable yet",
      );
    }
    if (admission.feeStatus === "Paid") {
      // Already settled: hand back the same receipt rather than charging twice.
      return res.json({
        ok: true,
        alreadyPaid: true,
        reference: admission.paymentRef,
        applicationId: admission.id,
        paidAt: admission.paidAt,
        amount: admission.fee,
        studentId: admission.studentId,
      });
    }

    const paid = amount === undefined ? admission.fee : Number(amount);
    if (!Number.isFinite(paid) || paid < admission.fee) {
      throw badRequest(`The full seat fee of ${admission.fee} is payable`);
    }

    const ref = reference();
    const paidAt = new Date().toISOString();

    // Enrol the student and issue their credentials.
    const studentId = await nextId(Student, "ST-", 8801);
    const password = generatePassword();
    const studentEmail = await instituteEmail(admission.name);

    await Student.create({
      id: studentId,
      name: admission.name,
      program: admission.program,
      sem: 1,
      dept: PROGRAM_DEPT[admission.program] ?? "Computer Science",
      email: studentEmail,
      phone: admission.phone,
      guardian: "—",
      status: "Active",
    });

    await User.create({
      email: studentEmail,
      password,
      name: admission.name,
      role: "student",
      linkedId: studentId,
    });

    admission.feeStatus = "Paid";
    admission.paidAt = paidAt;
    admission.paymentRef = ref;
    admission.studentId = studentId;
    await admission.save();

    await AdmissionFee.findOneAndUpdate(
      { id: admission.id },
      {
        id: admission.id,
        name: admission.name,
        program: admission.program,
        payable: admission.fee,
        paid,
        mode: "Card",
        ref,
        status: "Paid",
      },
      { upsert: true, setDefaultsOnInsert: true },
    );

    await Payment.create({
      reference: ref,
      kind: "admission",
      applicationId: admission.id,
      name: admission.name,
      email: admission.email,
      program: admission.program,
      amount: paid,
      paidAt,
    });

    res.status(201).json({
      ok: true,
      reference: ref,
      applicationId: admission.id,
      paidAt,
      amount: paid,
      status: "Confirmed",
      // Shown to the applicant once, on the confirmation screen.
      credentials: { studentId, email: studentEmail, password, portal: "/student" },
    });
  }),
);

/**
 * POST /api/payments/student — semester fees and fines from the student portal.
 * Settles the matching fee head or fine and keeps the student's balances in step.
 */
router.post(
  "/student",
  route(async (req, res) => {
    const { studentId, head, amount } = req.body ?? {};
    if (!studentId) throw badRequest("studentId is required");
    const paid = Number(amount);
    if (!Number.isFinite(paid) || paid < 0) throw badRequest("amount must be a positive number");

    const student = await Student.findOne({ id: studentId });
    if (!student) throw badRequest(`Unknown student ${studentId}`);

    const ref = reference();
    const paidAt = new Date().toISOString();

    const fee = head ? await StudentFee.findOne({ id: studentId, head }) : null;
    if (fee) {
      fee.paid = Math.min(fee.payable, fee.paid + paid);
      fee.status = fee.paid >= fee.payable ? "Paid" : "Partial";
      await fee.save();
      student.feesDue = Math.max(0, student.feesDue - paid);
    } else {
      // No matching fee head — treat it as settling outstanding fines.
      const unpaid = await Fine.find({
        status: "Unpaid",
        $or: [{ studentId }, { student: student.name }],
      }).sort({ raised: 1 });

      let left = paid;
      for (const fine of unpaid) {
        if (left < fine.amount) break;
        left -= fine.amount;
        fine.status = "Paid";
        await fine.save();
      }
      student.fines = Math.max(0, student.fines - (paid - left));
    }
    await student.save();

    await Payment.create({
      reference: ref,
      kind: "student",
      studentId,
      name: student.name,
      program: student.program,
      head: head || "Fines",
      amount: paid,
      mode: "UPI",
      paidAt,
    });

    res.status(201).json({
      ok: true,
      reference: ref,
      studentId,
      head: head || "Fines",
      paidAt,
      amount: paid,
      feesDue: student.feesDue,
      fines: student.fines,
    });
  }),
);

/** GET /api/payments?kind=&studentId= — the gateway ledger. */
router.get(
  "/",
  route(async (req, res) => {
    const filter = {};
    if (req.query.kind) filter.kind = req.query.kind;
    if (req.query.studentId) filter.studentId = req.query.studentId;
    if (req.query.applicationId) filter.applicationId = req.query.applicationId;
    res.json(await Payment.find(filter).sort({ paidAt: -1 }));
  }),
);

/** GET /api/payments/:reference — look up a single receipt. */
router.get(
  "/:reference",
  route(async (req, res) => {
    const row = await Payment.findOne({ reference: req.params.reference });
    if (!row) return res.status(404).json({ error: "Payment not found" });
    res.json(row);
  }),
);

module.exports = router;
