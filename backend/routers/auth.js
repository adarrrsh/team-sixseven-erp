const express = require("express");
const User = require("../models/User");
const { route, badRequest, HttpError } = require("../lib/http");

const router = express.Router();

router.post(
  "/login",
  route(async (req, res) => {
    const { email, password, role } = req.body ?? {};
    if (!email || !password) throw badRequest("email and password are required");

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user || user.password !== password) {
      throw new HttpError(401, "Invalid email or password");
    }
    if (role && user.role !== role) {
      throw new HttpError(403, `This account is not a ${role} account`);
    }

    res.json({ ok: true, user: user.toJSON(), portal: `/${user.role}` });
  }),
);

router.get(
  "/me",
  route(async (req, res) => {
    const { email } = req.query;
    if (!email) throw badRequest("email is required");
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) throw new HttpError(404, "User not found");
    res.json(user.toJSON());
  }),
);

module.exports = router;
