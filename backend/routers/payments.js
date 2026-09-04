const express = require("express");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const Admission = require("../models/Admission");
const AdmissionFee = require("../models/AdmissionFee");
const Student = require("../models/Student");
const StudentFee = require("../models/StudentFee");
const Fine = require("../models/Fine");
const { route, badRequest, nextId } = require("../lib/http");

const router = express.Router();

const reference = () =>
  "PAY-" + crypto.randomBytes(4).toString("hex").slice(0, 5).toUpperCase();

/**
 * POST /api/payments/admission — the dummy gateway behind the /apply flow.
 * Creates the application, records the fee, and returns the receipt shape
 * `frontend/src/lib/api.js` falls back to when the backend is unreachable.
 */
router.post(
  "/admission",
  route(async (req, res) => {
    const { name, email, program, amount, phone, applicationId } = req.body ?? {};
    if (!program) throw badRequest("program is required");
    const paid = Number(amount);
    if (!Number.isFinite(paid) || paid < 0) throw badRequest("amount must be a positive number");

    const id = applicationId || (await nextId(Admission, "AD-", 2041));
    const ref = reference();
    const paidAt = new Date().toISOString();

    await Admission.findOneAndUpdate(
      { id },
      {
        id,
        name: name || "Applicant",
        program,
        email: email || "—",
        phone: phone || "—",
        applied: paidAt.slice(0, 10),
        fee: paid,
        status: "Pending",
      },
      { upsert: true, setDefaultsOnInsert: true },
    );

    await AdmissionFee.findOneAndUpdate(
      { id },
      {
        id,
        name: name || "Applicant",
        program,
        payable: paid,
        paid,
        mode: "Card",
        ref,
        status: "Paid",
      },
      { upsert: true, setDefaultsOnInsert: true },
    );

    const payment = await Payment.create({
      reference: ref,
      kind: "admission",
      applicationId: id,
      name: name || "Applicant",
      email: email || "",
      program,
      amount: paid,
      paidAt,
    });

    res.status(201).json({
      ok: true,
      reference: ref,
      applicationId: id,
      paidAt,
      amount: paid,
      status: "Pending review",
      recordId: payment.toJSON().recordId,
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
