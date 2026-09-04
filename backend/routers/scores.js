const express = require("express");
const mongoose = require("mongoose");
const Score = require("../models/Score");
const Student = require("../models/Student");
const { route, notFound, badRequest, pick } = require("../lib/http");
const { grade } = require("../lib/grade");

const router = express.Router();

const clampMarks = (value) => Math.max(0, Math.min(100, Number(value) || 0));

/** GET /api/scores?exam=&course=&id=&program= */
router.get(
  "/",
  route(async (req, res) => {
    const { exam, course, id, program } = req.query;
    const filter = {};
    if (exam) filter.exam = exam;
    if (course) filter.course = course;
    if (id) filter.id = id;
    if (program) filter.program = program;
    res.json(await Score.find(filter).sort({ course: 1, name: 1 }));
  }),
);

/** GET /api/scores/by-course — course averages behind the score chart. */
router.get(
  "/by-course",
  route(async (_req, res) => {
    const rows = await Score.aggregate([
      { $group: { _id: "$course", value: { $avg: "$marks" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json(rows.map((r) => ({ label: r._id, value: Math.round(r.value), count: r.count })));
  }),
);

/** GET /api/scores/stats — records, average, distinctions, below pass. */
router.get(
  "/stats",
  route(async (_req, res) => {
    const [agg] = await Score.aggregate([
      { $group: { _id: null, records: { $sum: 1 }, average: { $avg: "$marks" } } },
    ]);
    const [distinctions, belowPass] = await Promise.all([
      Score.countDocuments({ marks: { $gte: 85 } }),
      Score.countDocuments({ marks: { $lt: 50 } }),
    ]);
    res.json({
      records: agg?.records ?? 0,
      average: Math.round(agg?.average ?? 0),
      distinctions,
      belowPass,
    });
  }),
);

/** POST /api/scores — publish a mark; upserts on (student, course, exam). */
router.post(
  "/",
  route(async (req, res) => {
    const body = req.body ?? {};
    if (!body.id || !body.course || !body.exam) {
      throw badRequest("id, course and exam are required");
    }
    const student = await Student.findOne({ id: body.id });
    const marks = clampMarks(body.marks);

    const row = await Score.findOneAndUpdate(
      { id: body.id, course: body.course, exam: body.exam },
      {
        ...pick(body, ["program", "max"]),
        id: body.id,
        course: body.course,
        exam: body.exam,
        name: body.name || student?.name || body.id,
        program: body.program || student?.program || "—",
        marks,
        grade: grade(marks),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    res.status(201).json(row);
  }),
);

/**
 * PATCH /api/scores/:key — update marks. `key` is either the `recordId` a row
 * carries or a `studentId::course` pair, since scores key on (student, course).
 */
router.patch(
  "/:key",
  route(async (req, res) => {
    const marks = clampMarks(req.body?.marks);
    if (req.body?.marks === undefined) throw badRequest("marks is required");

    const key = req.params.key;
    const filter = mongoose.isValidObjectId(key)
      ? { _id: key }
      : (() => {
          const [id, course] = key.split("::");
          if (!course) throw badRequest("key must be a recordId or 'studentId::course'");
          return { id, course };
        })();

    if (req.body?.exam) filter.exam = req.body.exam;

    const row = await Score.findOneAndUpdate(
      filter,
      { marks, grade: grade(marks) },
      { new: true },
    );
    if (!row) throw notFound("Score");
    res.json(row);
  }),
);

router.delete(
  "/:key",
  route(async (req, res) => {
    const key = req.params.key;
    const filter = mongoose.isValidObjectId(key) ? { _id: key } : { id: key.split("::")[0], course: key.split("::")[1] };
    const row = await Score.findOneAndDelete(filter);
    if (!row) throw notFound("Score");
    res.json({ ok: true });
  }),
);

module.exports = router;
