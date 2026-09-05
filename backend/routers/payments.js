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
const { enrolFromAdmission } = require("../lib/enrolment");

const router = express.Router();

const reference = () =>
  "PAY-" + crypto.randomBytes(4).toString("hex").slice(0, 5).toUpperCase();

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

    const { studentId, email: studentEmail, password } = await enrolFromAdmission(admission);

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
      credentials: { studentId, email: studentEmail, password, portal: "/student" },
    });
  }),
);

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

router.get(
  "/:reference",
  route(async (req, res) => {
    const row = await Payment.findOne({ reference: req.params.reference });
    if (!row) return res.status(404).json({ error: "Payment not found" });
    res.json(row);
  }),
);

module.exports = router;
