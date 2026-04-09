const nodemailer = require("nodemailer");
const { decryptString } = require("../utils/crypto");

function buildEmail(alert) {
  const category = alert?.category || "unknown";
  const severity = alert?.severity || "medium";
  const confidence = typeof alert?.confidence === "number" ? alert.confidence : null;
  const content = alert?.content || "";

  const subject = `SafeGuard AI Alert: ${category.toUpperCase()} (${severity})`;

  const lines = [
    `SafeGuard AI detected suspicious content.`,
    ``,
    `Category: ${category}`,
    `Severity: ${severity}`,
    confidence !== null ? `Confidence: ${confidence}%` : null,
    ``,
    `Content:`,
    content,
  ].filter(Boolean);

  const evidenceLinks = [];
  if (alert?.evidence?.screenshotUrl) evidenceLinks.push(`Screenshot: ${alert.evidence.screenshotUrl}`);
  if (alert?.evidence?.audioUrl) evidenceLinks.push(`Audio: ${alert.evidence.audioUrl}`);

  return {
    subject,
    text: [
      ...lines,
      ...(evidenceLinks.length ? [""] : []),
      ...evidenceLinks,
    ].join("\n"),
  };
}

async function sendAlertEmail({ user, alert }) {
  if (!user?.parentEmail) throw new Error("Parent email not set");
  if (!user?.emailPasswordEncrypted?.ciphertext) throw new Error("Missing email password");

  // Decrypt password at runtime only.
  const emailPassword = decryptString(user.emailPasswordEncrypted);
  if (!emailPassword) throw new Error("Failed to decrypt email password");

  const { subject, text } = buildEmail(alert);

  const transporter = nodemailer.createTransport({
    auth: {
      user: user.childEmail,
      pass: emailPassword,
    },
  });

  await transporter.sendMail({
    from: user.childEmail,
    to: user.parentEmail,
    subject,
    text,
  });
}

module.exports = { sendAlertEmail };

