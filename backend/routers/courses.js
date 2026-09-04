const express = require("express");
const Course = require("../models/Course");
const { route, notFound, badRequest, contains, pick } = require("../lib/http");

const router = express.Router();

const WRITABLE = ["title", "dept", "credits", "faculty", "enrolled", "sem"];

/** GET /api/courses?dept=&sem=&q= */
router.get(
  "/",
  route(async (req, res) => {
    const { dept, sem, faculty, q } = req.query;
    const filter = {};
    if (dept) filter.dept = dept;
    if (sem) filter.sem = Number(sem);
    if (faculty) filter.faculty = faculty;
    if (q) filter.$or = [{ title: contains(q) }, { code: contains(q) }, { faculty: contains(q) }];
    res.json(await Course.find(filter).sort({ code: 1 }));
  }),
);

router.post(
  "/",
  route(async (req, res) => {
    const body = req.body ?? {};
    if (!body.code || !body.title || !body.dept) {
      throw badRequest("code, title and dept are required");
    }
    res.status(201).json(await Course.create({ ...pick(body, WRITABLE), code: body.code }));
  }),
);

router.get(
  "/:code",
  route(async (req, res) => {
    const row = await Course.findOne({ code: req.params.code });
    if (!row) throw notFound("Course");
    res.json(row);
  }),
);

router.patch(
  "/:code",
  route(async (req, res) => {
    const row = await Course.findOneAndUpdate(
      { code: req.params.code },
      pick(req.body ?? {}, WRITABLE),
      { new: true, runValidators: true },
    );
    if (!row) throw notFound("Course");
    res.json(row);
  }),
);

router.delete(
  "/:code",
  route(async (req, res) => {
    const row = await Course.findOneAndDelete({ code: req.params.code });
    if (!row) throw notFound("Course");
    res.json({ ok: true, code: req.params.code });
  }),
);

module.exports = router;
