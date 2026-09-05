const express = require("express");

const router = express.Router();

router.use("/auth", require("./auth"));
router.use("/admissions", require("./admissions"));
router.use("/applicants", require("./applicants"));
router.use("/faculty", require("./faculty"));
router.use("/students", require("./students"));
router.use("/attendance", require("./attendance"));
router.use("/cards", require("./cards"));
router.use("/courses", require("./courses"));
router.use("/exams", require("./exams"));
router.use("/scores", require("./scores"));
router.use("/finances", require("./finances"));
router.use("/timetable", require("./timetable"));
router.use("/payments", require("./payments"));
router.use("/dashboard", require("./dashboard"));
router.use("/chatbot", require("./chatbot"));
router.use("/support", require("./support"));

module.exports = router;
