const express = require("express");
const User = require("../models/User");
const { encryptString } = require("../utils/crypto");

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function configRoutes(config) {
  const router = express.Router();

  // Save configuration: parent email + child email + email password/app-password.
  router.post("/save", async (req, res) => {
    const { parentEmail, childEmail, emailPassword } = req.body || {};

    if (!isValidEmail(parentEmail)) return res.status(400).json({ error: "Invalid parentEmail" });
    if (!isValidEmail(childEmail)) return res.status(400).json({ error: "Invalid childEmail" });
    if (typeof emailPassword !== "string" || emailPassword.length < 6) {
      return res.status(400).json({ error: "Invalid emailPassword" });
    }

    const ce = childEmail.trim().toLowerCase();
    const pe = parentEmail.trim().toLowerCase();

    const encrypted = encryptString(emailPassword);

    await User.updateOne(
      { childEmail: ce },
      { $set: { childEmail: ce, parentEmail: pe, emailPasswordEncrypted: encrypted } },
      { upsert: true }
    );

    return res.json({ status: "ok", childEmail: ce, parentEmail: pe });
  });

  // Fetch config (no password returned)
  router.get("/get", async (req, res) => {
    const childEmail = String(req.query.childEmail || "").trim().toLowerCase();
    if (!childEmail) return res.status(400).json({ error: "Missing childEmail" });

    const user = await User.findOne({ childEmail }).lean().exec();
    if (!user) return res.status(404).json({ error: "Not found" });

    return res.json({ childEmail: user.childEmail, parentEmail: user.parentEmail });
  });

  return router;
}

module.exports = configRoutes;

