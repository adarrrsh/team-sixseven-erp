const express = require("express");
const Faculty = require("../models/Faculty");
const Leave = require("../models/Leave");
const Salary = require("../models/Salary");
const Exam = require("../models/Exam");
const Metric = require("../models/Metric");
const { route, notFound, badRequest, nextId, contains, pick } = require("../lib/http");

const router = express.Router();

const WRITABLE = ["name", "dept", "subject", "email", "phone", "exp", "salary", "attendance", "load", "status", "free"];

/* ---- collections that must resolve before the /:id route ---- */

/** GET /api/faculty/leaves?status= — leave requests queue. */
router.get(
  "/leaves",
  route(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.name) filter.name = req.query.name;
    if (req.query.dept) filter.dept = req.query.dept;
    res.json(await Leave.find(filter).sort({ from: -1 }));
  }),
);

/** POST /api/faculty/leaves — "Apply for leave" in the faculty portal. */
router.post(
  "/leaves",
  route(async (req, res) => {
    const body = req.body ?? {};
    if (!body.name || !body.from || !body.to) {
      throw badRequest("name, from and to are required");
    }
    const days =
      Number(body.days) ||
      Math.max(1, Math.round((new Date(body.to) - new Date(body.from)) / 86400000) + 1);

    const row = await Leave.create({
      id: body.id || (await nextId(Leave, "LV-", 3301)),
      name: body.name,
      dept: body.dept || "—",
      type: body.type || "Casual",
      from: body.from,
      to: body.to,
      days,
      cover: body.cover || "—",
      reason: body.reason || "",
      status: "Pending",
    });
    res.status(201).json(row);
  }),
);

/** PATCH /api/faculty/leaves/:id/status — Approve / Reject. */
router.patch(
  "/leaves/:id/status",
  route(async (req, res) => {
    const { status } = req.body ?? {};
    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      throw badRequest("status must be Pending, Approved or Rejected");
    }
    const row = await Leave.findOneAndUpdate({ id: req.params.id }, { status }, { new: true });
    if (!row) throw notFound("Leave request");

    // An approved leave puts the teacher on leave, so the timetable can route around them.
    if (status === "Approved") await Faculty.updateOne({ name: row.name }, { status: "On leave" });
    if (status === "Rejected") await Faculty.updateOne({ name: row.name }, { status: "Active" });

    res.json(row);
  }),
);

/** GET /api/faculty/salaries?month= — payroll register. */
router.get(
  "/salaries",
  route(async (req, res) => {
    const filter = {};
    if (req.query.month) filter.month = req.query.month;
    if (req.query.status) filter.status = req.query.status;
    res.json(await Salary.find(filter).sort({ name: 1 }));
  }),
);

/** PATCH /api/faculty/salaries/:id/status?month= — release or hold a payout. */
router.patch(
  "/salaries/:id/status",
  route(async (req, res) => {
    const { status, month } = req.body ?? {};
    if (!["Paid", "Processing", "Hold"].includes(status)) {
      throw badRequest("status must be Paid, Processing or Hold");
    }
    const filter = { id: req.params.id };
    if (month) filter.month = month;
    const row = await Salary.findOneAndUpdate(filter, { status }, { new: true });
    if (!row) throw notFound("Salary record");
    res.json(row);
  }),
);

/** GET /api/faculty/attendance — trend series plus the per-teacher figures. */
router.get(
  "/attendance",
  route(async (_req, res) => {
    const [trend, rows] = await Promise.all([
      Metric.find({ series: "facultyAttendance" }).sort({ order: 1 }),
      Faculty.find({}, { id: 1, name: 1, dept: 1, attendance: 1, _id: 0 }).sort({ name: 1 }).lean(),
    ]);
    res.json({
      trend: trend.map((m) => ({ label: m.label, value: m.value })),
      faculty: rows,
    });
  }),
);

/** GET /api/faculty/availability — free slots that drive timetable regeneration. */
router.get(
  "/availability",
  route(async (_req, res) => {
    const rows = await Faculty.find({}, { name: 1, free: 1, status: 1, _id: 0 }).sort({ name: 1 }).lean();
    res.json(rows.map((r) => ({ name: r.name, free: r.free ?? [], status: r.status })));
  }),
);

/** GET /api/faculty/duties — invigilator duty assignment board. */
router.get(
  "/duties",
  route(async (_req, res) => {
    res.json(await Exam.find().sort({ date: 1 }));
  }),
);

/** PATCH /api/faculty/duties/:examId — assign an invigilator to an exam. */
router.patch(
  "/duties/:examId",
  route(async (req, res) => {
    const { invigilator } = req.body ?? {};
    if (!invigilator) throw badRequest("invigilator is required");
    const row = await Exam.findOneAndUpdate(
      { id: req.params.examId },
      { invigilator },
      { new: true },
    );
    if (!row) throw notFound("Exam");
    res.json(row);
  }),
);

/* ---- the directory itself ---- */

/** GET /api/faculty?dept=&status=&q= — searchable teacher directory. */
router.get(
  "/",
  route(async (req, res) => {
    const { dept, status, q } = req.query;
    const filter = {};
    if (dept) filter.dept = dept;
    if (status) filter.status = status;
    if (q) filter.$or = [{ name: contains(q) }, { id: contains(q) }, { subject: contains(q) }, { email: contains(q) }];
    res.json(await Faculty.find(filter).sort({ name: 1 }));
  }),
);

/** POST /api/faculty — "Add a teacher". */
router.post(
  "/",
  route(async (req, res) => {
    const body = req.body ?? {};
    if (!body.name || !body.dept) throw badRequest("name and dept are required");

    const row = await Faculty.create({
      ...pick(body, WRITABLE),
      id: body.id || (await nextId(Faculty, "FC-", 118)),
    });
    res.status(201).json(row);
  }),
);

router.get(
  "/:id",
  route(async (req, res) => {
    const row = await Faculty.findOne({ id: req.params.id });
    if (!row) throw notFound("Faculty");
    res.json(row);
  }),
);

router.patch(
  "/:id",
  route(async (req, res) => {
    const row = await Faculty.findOneAndUpdate(
      { id: req.params.id },
      pick(req.body ?? {}, WRITABLE),
      { new: true, runValidators: true },
    );
    if (!row) throw notFound("Faculty");
    res.json(row);
  }),
);

router.delete(
  "/:id",
  route(async (req, res) => {
    const row = await Faculty.findOneAndDelete({ id: req.params.id });
    if (!row) throw notFound("Faculty");
    res.json({ ok: true, id: req.params.id });
  }),
);

module.exports = router;
