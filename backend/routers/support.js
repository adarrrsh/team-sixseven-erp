const express = require("express");
const SupportRequest = require("../models/SupportRequest");
const { route, notFound, badRequest, nextId, contains } = require("../lib/http");

const router = express.Router();

const MAX_QUESTION = 800;

/**
 * POST /api/support/handoff — the chatbot giving up and fetching a person.
 *
 * The visitor's question and the conversation that led to it are kept together,
 * so whoever picks the ticket up does not have to make them start again.
 */
router.post(
  "/handoff",
  route(async (req, res) => {
    const { name, email, question, transcript, source } = req.body ?? {};
    if (!question || !String(question).trim()) throw badRequest("question is required");

    const request = await SupportRequest.create({
      id: await nextId(SupportRequest, "SUP-", 1001),
      name: name || "Visitor",
      email: email || "",
      question: String(question).slice(0, MAX_QUESTION),
      transcript: Array.isArray(transcript) ? transcript.slice(-20) : [],
      source: source || "login",
      status: "Open",
    });

    res.status(201).json({
      ok: true,
      id: request.id,
      status: request.status,
      message:
        "A member of the team has been notified and will follow up" +
        (request.email ? ` at ${request.email}.` : "."),
    });
  }),
);

/** GET /api/support?status=&q= — the admin queue. */
router.get(
  "/",
  route(async (req, res) => {
    const { status, q } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (q) filter.$or = [{ question: contains(q) }, { name: contains(q) }, { email: contains(q) }, { id: contains(q) }];
    res.json(await SupportRequest.find(filter).sort({ raisedAt: -1 }));
  }),
);

/** GET /api/support/stats — counts for the queue's header. */
router.get(
  "/stats",
  route(async (_req, res) => {
    const [open, claimed, resolved] = await Promise.all([
      SupportRequest.countDocuments({ status: "Open" }),
      SupportRequest.countDocuments({ status: "Claimed" }),
      SupportRequest.countDocuments({ status: "Resolved" }),
    ]);
    res.json({ open, claimed, resolved, total: open + claimed + resolved });
  }),
);

router.get(
  "/:id",
  route(async (req, res) => {
    const row = await SupportRequest.findOne({ id: req.params.id });
    if (!row) throw notFound("Support request");
    res.json(row);
  }),
);

/** PATCH /api/support/:id — claim it, resolve it, or add a reply to the thread. */
router.patch(
  "/:id",
  route(async (req, res) => {
    const { status, reply, claimedBy } = req.body ?? {};
    const request = await SupportRequest.findOne({ id: req.params.id });
    if (!request) throw notFound("Support request");

    if (status) {
      if (!["Open", "Claimed", "Resolved"].includes(status)) {
        throw badRequest("status must be Open, Claimed or Resolved");
      }
      request.status = status;
      request.resolvedAt = status === "Resolved" ? new Date().toISOString() : "";
    }
    if (claimedBy !== undefined) request.claimedBy = claimedBy;
    if (reply && String(reply).trim()) {
      request.transcript.push({
        from: "admin",
        text: String(reply).slice(0, MAX_QUESTION),
        at: new Date().toISOString(),
      });
      if (request.status === "Open") request.status = "Claimed";
    }

    await request.save();
    res.json(request);
  }),
);

module.exports = router;
