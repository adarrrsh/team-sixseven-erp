const express = require("express");
const Exam = require("../models/Exam");
const Score = require("../models/Score");
const { route, notFound, badRequest, nextId, pick } = require("../lib/http");

const router = express.Router();

const WRITABLE = ["title", "program", "date", "slot", "room", "invigilator", "students", "status"];

router.get(
  "/",
  route(async (req, res) => {
    const { status, program } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (program) filter.program = program;
    res.json(await Exam.find(filter).sort({ date: -1 }));
  }),
);

router.post(
  "/",
  route(async (req, res) => {
    const body = req.body ?? {};
    if (!body.title || !body.program) throw badRequest("title and program are required");

    const row = await Exam.create({
      ...pick(body, WRITABLE),
      id: body.id || (await nextId(Exam, "EX-", 701)),
      date: body.date || "2026-10-01",
    });
    res.status(201).json(row);
  }),
);

router.get(
  "/:id",
  route(async (req, res) => {
    const row = await Exam.findOne({ id: req.params.id });
    if (!row) throw notFound("Exam");
    res.json(row);
  }),
);

router.get(
  "/:id/scores",
  route(async (req, res) => {
    const exam = await Exam.findOne({ id: req.params.id });
    if (!exam) throw notFound("Exam");
    res.json(await Score.find({ exam: exam.title }).sort({ name: 1 }));
  }),
);

router.patch(
  "/:id",
  route(async (req, res) => {
    const row = await Exam.findOneAndUpdate(
      { id: req.params.id },
      pick(req.body ?? {}, WRITABLE),
      { new: true, runValidators: true },
    );
    if (!row) throw notFound("Exam");
    res.json(row);
  }),
);

router.delete(
  "/:id",
  route(async (req, res) => {
    const row = await Exam.findOneAndDelete({ id: req.params.id });
    if (!row) throw notFound("Exam");
    res.json({ ok: true, id: req.params.id });
  }),
);

module.exports = router;
