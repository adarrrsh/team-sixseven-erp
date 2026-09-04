const express = require("express");
const StudentFee = require("../models/StudentFee");
const AdmissionFee = require("../models/AdmissionFee");
const Salary = require("../models/Salary");
const Metric = require("../models/Metric");
const { route } = require("../lib/http");

const router = express.Router();

const sum = (rows, key) => rows.reduce((total, row) => total + (row[key] ?? 0), 0);

/** GET /api/finances/summary — the four cards and the "where the money sits" split. */
router.get(
  "/summary",
  route(async (_req, res) => {
    const [studentFees, admissionFees, salaries] = await Promise.all([
      StudentFee.find().lean(),
      AdmissionFee.find().lean(),
      Salary.find().lean(),
    ]);

    const tuitionCollected = sum(studentFees, "paid");
    const tuitionDue = sum(studentFees, "payable") - tuitionCollected;
    const admissionCollected = sum(admissionFees, "paid");
    const payroll = sum(salaries, "net");

    res.json({
      tuitionCollected,
      tuitionDue,
      admissionCollected,
      payroll,
      overdueAccounts: studentFees.filter((f) => f.status === "Overdue").length,
      split: [
        { label: "Tuition collected", value: tuitionCollected, tone: "green" },
        { label: "Admission fees", value: admissionCollected, tone: "blue" },
        { label: "Outstanding", value: tuitionDue, tone: "red" },
        { label: "Payroll committed", value: payroll, tone: "pink" },
      ],
    });
  }),
);

/** GET /api/finances/collection-trend — the collection-rate bar chart. */
router.get(
  "/collection-trend",
  route(async (_req, res) => {
    const rows = await Metric.find({ series: "feeCollection" }).sort({ order: 1 });
    res.json(rows.map((m) => ({ label: m.label, value: m.value })));
  }),
);

/** GET /api/finances/student-fees and /admission-fees back the two tabs. */
router.get(
  "/student-fees",
  route(async (req, res) => {
    const filter = req.query.status ? { status: req.query.status } : {};
    res.json(await StudentFee.find(filter).sort({ due: 1 }));
  }),
);

router.get(
  "/admission-fees",
  route(async (req, res) => {
    const filter = req.query.status ? { status: req.query.status } : {};
    res.json(await AdmissionFee.find(filter).sort({ id: 1 }));
  }),
);

router.get(
  "/salaries",
  route(async (req, res) => {
    const filter = req.query.month ? { month: req.query.month } : {};
    res.json(await Salary.find(filter).sort({ name: 1 }));
  }),
);

module.exports = router;
