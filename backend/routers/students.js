const express = require("express");
const Student = require("../models/Student");
const StudentFee = require("../models/StudentFee");
const Fine = require("../models/Fine");
const Score = require("../models/Score");
const Course = require("../models/Course");
const Exam = require("../models/Exam");
const { route, notFound, badRequest, nextId, contains, pick } = require("../lib/http");

const router = express.Router();

const WRITABLE = ["name", "program", "sem", "dept", "attendance", "cgpa", "feesDue", "fines", "email", "phone", "guardian", "status"];

router.get(
  "/fees",
  route(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.id) filter.id = req.query.id;
    res.json(await StudentFee.find(filter).sort({ due: 1 }));
  }),
);

router.get(
  "/fines",
  route(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.student) filter.student = req.query.student;
    if (req.query.studentId) filter.studentId = req.query.studentId;
    res.json(await Fine.find(filter).sort({ raised: -1 }));
  }),
);

router.post(
  "/fines",
  route(async (req, res) => {
    const body = req.body ?? {};
    if (!body.student || !body.reason) throw badRequest("student and reason are required");

    const row = await Fine.create({
      id: body.id || (await nextId(Fine, "FN-", 201)),
      student: body.student,
      studentId: body.studentId || "",
      reason: body.reason,
      amount: Number(body.amount) || 0,
      raised: body.raised || new Date().toISOString().slice(0, 10),
      status: "Unpaid",
    });
    if (row.studentId) {
      await Student.updateOne({ id: row.studentId }, { $inc: { fines: row.amount } });
    }
    res.status(201).json(row);
  }),
);

router.patch(
  "/fines/:id/settle",
  route(async (req, res) => {
    const row = await Fine.findOneAndUpdate({ id: req.params.id }, { status: "Paid" }, { new: true });
    if (!row) throw notFound("Fine");
    if (row.studentId) {
      await Student.updateOne({ id: row.studentId }, { $inc: { fines: -row.amount } });
    }
    res.json(row);
  }),
);

router.get(
  "/stats",
  route(async (_req, res) => {
    const [agg] = await Student.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          dueTotal: { $sum: "$feesDue" },
          finesTotal: { $sum: "$fines" },
          avgAttendance: { $avg: "$attendance" },
          avgCgpa: { $avg: "$cgpa" },
        },
      },
    ]);
    const probation = await Student.countDocuments({ status: "Probation" });
    res.json({
      total: agg?.total ?? 0,
      dueTotal: agg?.dueTotal ?? 0,
      finesTotal: agg?.finesTotal ?? 0,
      avgAttendance: Math.round(agg?.avgAttendance ?? 0),
      avgCgpa: Number((agg?.avgCgpa ?? 0).toFixed(2)),
      probation,
    });
  }),
);

router.get(
  "/",
  route(async (req, res) => {
    const { dept, program, sem, status, q } = req.query;
    const filter = {};
    if (dept) filter.dept = dept;
    if (program) filter.program = program;
    if (sem) filter.sem = Number(sem);
    if (status) filter.status = status;
    if (q) filter.$or = [{ name: contains(q) }, { id: contains(q) }, { email: contains(q) }, { guardian: contains(q) }];
    res.json(await Student.find(filter).sort({ id: 1 }));
  }),
);

router.post(
  "/",
  route(async (req, res) => {
    const body = req.body ?? {};
    if (!body.name || !body.dept) throw badRequest("name and dept are required");

    const row = await Student.create({
      ...pick(body, WRITABLE),
      id: body.id || (await nextId(Student, "ST-", 8801)),
    });
    res.status(201).json(row);
  }),
);

router.get(
  "/:id",
  route(async (req, res) => {
    const row = await Student.findOne({ id: req.params.id });
    if (!row) throw notFound("Student");
    res.json(row);
  }),
);

router.get(
  "/:id/profile",
  route(async (req, res) => {
    const student = await Student.findOne({ id: req.params.id });
    if (!student) throw notFound("Student");

    const [fees, fines, scores, courses, exams] = await Promise.all([
      StudentFee.find({ id: student.id }).sort({ due: 1 }),
      Fine.find({ $or: [{ studentId: student.id }, { student: student.name }] }).sort({ raised: -1 }),
      Score.find({ id: student.id }).sort({ course: 1 }),
      Course.find({ dept: student.dept, sem: student.sem }).sort({ code: 1 }),
      Exam.find({ program: student.program }).sort({ date: 1 }),
    ]);

    res.json({ student, fees, fines, scores, courses, exams });
  }),
);

router.patch(
  "/:id",
  route(async (req, res) => {
    const row = await Student.findOneAndUpdate(
      { id: req.params.id },
      pick(req.body ?? {}, WRITABLE),
      { new: true, runValidators: true },
    );
    if (!row) throw notFound("Student");
    res.json(row);
  }),
);

router.patch(
  "/:id/attendance",
  route(async (req, res) => {
    const { attendance } = req.body ?? {};
    const value = Number(attendance);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw badRequest("attendance must be a number between 0 and 100");
    }
    const row = await Student.findOneAndUpdate(
      { id: req.params.id },
      { attendance: Math.round(value) },
      { new: true },
    );
    if (!row) throw notFound("Student");
    res.json(row);
  }),
);

router.delete(
  "/:id",
  route(async (req, res) => {
    const row = await Student.findOneAndDelete({ id: req.params.id });
    if (!row) throw notFound("Student");
    res.json({ ok: true, id: req.params.id });
  }),
);

module.exports = router;
