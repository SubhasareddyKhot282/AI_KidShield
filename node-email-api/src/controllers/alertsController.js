const User = require("../models/User");
const { sendAlertEmail } = require("../services/alertsService");

async function sendAlert(req, res) {
  const { childEmail, alert } = req.body || {};
  if (!childEmail) return res.status(400).json({ error: "Missing childEmail" });
  if (!alert) return res.status(400).json({ error: "Missing alert" });

  const user = await User.findOne({ childEmail: String(childEmail).trim().toLowerCase() }).exec();
  if (!user) return res.status(404).json({ error: "User not found" });

  await sendAlertEmail({ user, alert });
  return res.json({ status: "sent" });
}

module.exports = { sendAlert };

