const express = require("express");
const Admission = require("../models/Admission");
const AdmissionFee = require("../models/AdmissionFee");
const { route, notFound, badRequest, nextId, contains, pick } = require("../lib/http");

const router = express.Router();

const WRITABLE = ["name", "program", "score", "applied", "fee", "status", "email", "phone"];

router.get(
  "/",
  route(async (req, res) => {
    const { status, program, q } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (program) filter.program = program;
    if (q) filter.$or = [{ name: contains(q) }, { id: contains(q) }, { email: contains(q) }];
    res.json(await Admission.find(filter).sort({ applied: -1, id: -1 }));
  }),
);

router.get(
  "/stats",
  route(async (_req, res) => {
    const [pending, approved, rejected, total] = await Promise.all([
      Admission.countDocuments({ status: "Pending" }),
      Admission.countDocuments({ status: "Approved" }),
      Admission.countDocuments({ status: "Rejected" }),
      Admission.countDocuments(),
    ]);
    res.json({ pending, approved, rejected, total });
  }),
);

router.get(
  "/fees",
  route(async (req, res) => {
    const filter = req.query.status ? { status: req.query.status } : {};
    res.json(await AdmissionFee.find(filter).sort({ id: 1 }));
  }),
);

router.get(
  "/:id",
  route(async (req, res) => {
    const row = await Admission.findOne({ id: req.params.id });
    if (!row) throw notFound("Admission");
    res.json(row);
  }),
);

router.post(
  "/",
  route(async (req, res) => {
    const body = req.body ?? {};
    if (!body.name || !body.program) throw badRequest("name and program are required");

    const row = await Admission.create({
      ...pick(body, WRITABLE),
      id: body.id || (await nextId(Admission, "AD-", 2041)),
      applied: body.applied || new Date().toISOString().slice(0, 10),
      status: "Pending",
    });
    res.status(201).json(row);
  }),
);

router.patch(
  "/:id/status",
  route(async (req, res) => {
    const { status } = req.body ?? {};
    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      throw badRequest("status must be Pending, Approved or Rejected");
    }

    const existing = await Admission.findOne({ id: req.params.id });
    if (!existing) throw notFound("Admission");

    if (existing.feeStatus === "Paid" && status !== existing.status) {
      throw badRequest(
        "This seat is already confirmed and paid for — the decision cannot be changed",
      );
    }

    existing.status = status;
    existing.decidedAt = new Date().toISOString().slice(0, 10);
    await existing.save();
    res.json(existing);
  }),
);

router.patch(
  "/:id",
  route(async (req, res) => {
    const row = await Admission.findOneAndUpdate(
      { id: req.params.id },
      pick(req.body ?? {}, WRITABLE),
      { new: true, runValidators: true },
    );
    if (!row) throw notFound("Admission");
    res.json(row);
  }),
);

router.delete(
  "/:id",
  route(async (req, res) => {
    const row = await Admission.findOneAndDelete({ id: req.params.id });
    if (!row) throw notFound("Admission");
    res.json({ ok: true, id: req.params.id });
  }),
);

module.exports = router;
