const express = require("express");
const Admission = require("../models/Admission");
const AdmissionFee = require("../models/AdmissionFee");
const User = require("../models/User");
const { route, notFound, badRequest, HttpError, nextId } = require("../lib/http");

const router = express.Router();

/** Application fee by programme, mirroring the options on the apply form. */
const PROGRAM_FEES = {
  "B.Tech CSE": 2500,
  "B.Tech ECE": 2500,
  "B.Tech MECH": 2200,
  "B.Com Hons": 1500,
};

/** The seat fee an approved applicant pays to confirm admission. */
const SEAT_FEES = {
  "B.Tech CSE": 78000,
  "B.Tech ECE": 74000,
  "B.Tech MECH": 69000,
  "B.Com Hons": 52000,
};

/**
 * What the applicant portal renders, derived from the application's state so
 * the page never has to work the stage out itself.
 */
function toStatus(admission) {
  const stage =
    admission.status === "Rejected"
      ? "rejected"
      : admission.status === "Pending"
        ? "under-review"
        : admission.feeStatus === "Paid"
          ? "confirmed"
          : "awaiting-payment";

  return {
    stage,
    application: admission.toJSON(),
    /** Only ever set once the seat fee has cleared. */
    credentials: admission.studentId
      ? { studentId: admission.studentId, portal: "/student" }
      : null,
  };
}

/**
 * POST /api/applicants/register — the admission form.
 * Creates the application (Pending) and the login the applicant uses to track it.
 * No payment is taken here: the fee is only payable once the registrar approves.
 */
router.post(
  "/register",
  route(async (req, res) => {
    const body = req.body ?? {};
    const email = String(body.email ?? "").toLowerCase().trim();

    if (!body.name || !email || !body.password || !body.program) {
      throw badRequest("name, email, password and program are required");
    }
    if (!SEAT_FEES[body.program]) {
      throw badRequest(`Unknown programme ${body.program}`);
    }
    if (await User.findOne({ email })) {
      throw new HttpError(409, "An account with that email already exists");
    }

    const id = await nextId(Admission, "AD-", 2041);
    const admission = await Admission.create({
      id,
      name: body.name,
      email,
      phone: body.phone || "—",
      dob: body.dob || "",
      program: body.program,
      board: body.board || "",
      score: Number(body.percentage) || 0,
      statement: body.statement || "",
      applied: new Date().toISOString().slice(0, 10),
      fee: SEAT_FEES[body.program],
      status: "Pending",
      feeStatus: "Unpaid",
    });

    await User.create({
      email,
      password: body.password,
      name: body.name,
      role: "applicant",
      linkedId: id,
    });

    // The tracker row exists from the start so the registrar sees who still owes.
    await AdmissionFee.create({
      id,
      name: body.name,
      program: body.program,
      payable: SEAT_FEES[body.program],
      paid: 0,
      status: "Unpaid",
    });

    res.status(201).json({ ok: true, ...toStatus(admission) });
  }),
);

/** GET /api/applicants/me?email= — the applicant portal's single source of truth. */
router.get(
  "/me",
  route(async (req, res) => {
    const email = String(req.query.email ?? "").toLowerCase().trim();
    if (!email) throw badRequest("email is required");

    const admission = await Admission.findOne({ email });
    if (!admission) throw notFound("Application");

    res.json(toStatus(admission));
  }),
);

/** GET /api/applicants/fees — programme fees, so the form can price itself. */
router.get("/fees", (_req, res) =>
  res.json(
    Object.keys(SEAT_FEES).map((program) => ({
      program,
      applicationFee: PROGRAM_FEES[program],
      seatFee: SEAT_FEES[program],
    })),
  ),
);

module.exports = router;
module.exports.SEAT_FEES = SEAT_FEES;
