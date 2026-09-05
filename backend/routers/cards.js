const express = require("express");
const Card = require("../models/Card");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const { normaliseUid } = require("../lib/uid");
const { route, notFound, badRequest, HttpError, contains } = require("../lib/http");
const { modelFor } = require("../lib/attendance");

const router = express.Router();

router.get(
  "/",
  route(async (req, res) => {
    const { holderType, status, q } = req.query;
    const filter = {};
    if (holderType) filter.holderType = holderType;
    if (status) filter.status = status;
    if (q) filter.$or = [{ cardId: contains(q) }, { holderName: contains(q) }, { holderId: contains(q) }];
    res.json(await Card.find(filter).sort({ holderName: 1 }));
  }),
);

router.get(
  "/:cardId",
  route(async (req, res) => {
    const card = await Card.findOne({ cardId: normaliseUid(req.params.cardId) });
    if (!card) throw notFound("Card");
    res.json(card);
  }),
);

router.post(
  "/",
  route(async (req, res) => {
    const { cardId, holderType, holderId } = req.body ?? {};
    if (!cardId || !holderType || !holderId) {
      throw badRequest("cardId, holderType and holderId are required");
    }
    if (!["student", "faculty"].includes(holderType)) {
      throw badRequest("holderType must be student or faculty");
    }

    const holder = await modelFor(holderType).findOne({ id: holderId });
    if (!holder) throw new HttpError(404, `No ${holderType} with id ${holderId}`);

    const uid = normaliseUid(cardId);
    if (await Card.findOne({ cardId: uid })) {
      throw new HttpError(409, `Card ${uid} is already issued`);
    }

    const card = await Card.create({
      cardId: uid,
      holderType,
      holderId,
      holderName: holder.name,
    });
    res.status(201).json(card);
  }),
);

router.patch(
  "/:cardId",
  route(async (req, res) => {
    const { status } = req.body ?? {};
    if (!["Active", "Lost", "Deactivated"].includes(status)) {
      throw badRequest("status must be Active, Lost or Deactivated");
    }
    const card = await Card.findOneAndUpdate(
      { cardId: normaliseUid(req.params.cardId) },
      { status },
      { new: true },
    );
    if (!card) throw notFound("Card");
    res.json(card);
  }),
);

router.delete(
  "/:cardId",
  route(async (req, res) => {
    const card = await Card.findOneAndDelete({ cardId: normaliseUid(req.params.cardId) });
    if (!card) throw notFound("Card");
    res.json({ ok: true, cardId: card.cardId });
  }),
);

module.exports = router;
