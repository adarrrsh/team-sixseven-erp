const express = require("express");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Admission = require("../models/Admission");
const Exam = require("../models/Exam");
const Course = require("../models/Course");
const StudentFee = require("../models/StudentFee");
const Leave = require("../models/Leave");
const Metric = require("../models/Metric");
const { route } = require("../lib/http");

const router = express.Router();

/** GET /api/dashboard — the admin landing page in one round trip. */
router.get(
  "/",
  route(async (_req, res) => {
    const [
      students,
      faculty,
      pendingAdmissions,
      scheduledExams,
      courses,
      pendingLeaves,
      fees,
      attendanceTrend,
      collectionTrend,
      byDept,
    ] = await Promise.all([
      Student.countDocuments(),
      Faculty.countDocuments(),
      Admission.countDocuments({ status: "Pending" }),
      Exam.countDocuments({ status: "Scheduled" }),
      Course.countDocuments(),
      Leave.countDocuments({ status: "Pending" }),
      StudentFee.find().lean(),
      Metric.find({ series: "facultyAttendance" }).sort({ order: 1 }).lean(),
      Metric.find({ series: "feeCollection" }).sort({ order: 1 }).lean(),
      Student.aggregate([
        { $group: { _id: "$dept", value: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const collected = fees.reduce((s, f) => s + f.paid, 0);
    const billed = fees.reduce((s, f) => s + f.payable, 0);

    res.json({
      counts: { students, faculty, courses, pendingAdmissions, scheduledExams, pendingLeaves },
      fees: { collected, outstanding: billed - collected, billed },
      facultyAttendanceTrend: attendanceTrend.map((m) => ({ label: m.label, value: m.value })),
      feeCollectionTrend: collectionTrend.map((m) => ({ label: m.label, value: m.value })),
      studentsByDept: byDept.map((d) => ({ label: d._id, value: d.value })),
    });
  }),
);

/** GET /api/dashboard/departments — the DEPARTMENTS list every filter uses. */
router.get(
  "/departments",
  route(async (_req, res) => {
    const depts = await Faculty.distinct("dept");
    res.json(depts.sort());
  }),
);

/**
 * GET /api/dashboard/org-graph — nodes and edges for the React Flow graph:
 * institute → department → faculty, with courses hanging off each teacher.
 */
router.get(
  "/org-graph",
  route(async (_req, res) => {
    const [faculty, courses] = await Promise.all([
      Faculty.find({}, { id: 1, name: 1, dept: 1, _id: 0 }).lean(),
      Course.find({}, { code: 1, title: 1, faculty: 1, dept: 1, _id: 0 }).lean(),
    ]);

    const depts = [...new Set(faculty.map((f) => f.dept))].sort();
    const nodes = [
      { id: "institute", type: "root", label: "Origin", kind: "institute" },
      ...depts.map((d) => ({ id: `dept:${d}`, label: d, kind: "department" })),
      ...faculty.map((f) => ({ id: `faculty:${f.id}`, label: f.name, kind: "faculty", dept: f.dept })),
      ...courses.map((c) => ({ id: `course:${c.code}`, label: `${c.code} · ${c.title}`, kind: "course", dept: c.dept })),
    ];

    const edges = [
      ...depts.map((d) => ({ id: `e:institute-${d}`, source: "institute", target: `dept:${d}` })),
      ...faculty.map((f) => ({ id: `e:${f.dept}-${f.id}`, source: `dept:${f.dept}`, target: `faculty:${f.id}` })),
      ...courses.flatMap((c) => {
        const owner = faculty.find((f) => f.name === c.faculty);
        return owner
          ? [{ id: `e:${owner.id}-${c.code}`, source: `faculty:${owner.id}`, target: `course:${c.code}` }]
          : [{ id: `e:${c.dept}-${c.code}`, source: `dept:${c.dept}`, target: `course:${c.code}` }];
      }),
    ];

    res.json({ nodes, edges });
  }),
);

module.exports = router;
