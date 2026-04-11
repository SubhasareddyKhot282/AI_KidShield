const path = require("path");
const { v4: uuidv4 } = require("uuid");
const Media = require("../models/Media");
const config = require("../config");

function ensureKind(kind) {
  if (kind !== "screenshot" && kind !== "audio") return null;
  return kind;
}

async function listMyMedia(req, res) {
  const childEmail = String(req.query.childEmail || "").trim().toLowerCase();
  if (!childEmail) return res.status(400).json({ error: "Missing childEmail" });

  const kind = req.query.kind ? String(req.query.kind) : undefined;
  const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : 50;

  const filter = { childEmail };
  if (kind) {
    const k = ensureKind(kind);
    if (!k) return res.status(400).json({ error: "Invalid kind" });
    filter.kind = k;
  }

  const rows = await Media.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();

  return res.json(
    rows.map((m) => ({
      id: m._id,
      kind: m.kind,
      originalName: m.originalName,
      mimeType: m.mimeType,
      url: m.fileUrl,
      createdAt: m.createdAt,
      isLocked: m.isLocked || false,
    }))
  );
}

async function createMediaRecord(req, res) {
  const childEmail = String(req.body.childEmail || "").trim().toLowerCase();
  const kind = ensureKind(req.body.kind);
  if (!childEmail) return res.status(400).json({ error: "Missing childEmail" });
  if (!kind) return res.status(400).json({ error: "Invalid kind" });
  if (!req.file) return res.status(400).json({ error: "Missing file" });

  const rec = new Media({
    childEmail,
    kind,
    originalName: req.file.originalname || "upload",
    mimeType: req.file.mimetype || "",
    fileData: req.file.buffer,
    fileUrl: "temp",
  });

  rec.fileUrl = `${config.publicBaseUrl}/api/media/file/${rec._id}`;
  await rec.save();

  return res.json({
    status: "ok",
    media: {
      id: rec._id,
      kind: rec.kind,
      url: rec.fileUrl,
    },
  });
}

async function serveMediaFile(req, res) {
  try {
    const med = await Media.findById(req.params.id);
    if (!med || !med.fileData) return res.status(404).send("File not found");
    
    const fileBuffer = Buffer.from(med.fileData);
    res.set("Content-Type", med.mimeType || "application/octet-stream");
    res.set("Content-Length", fileBuffer.length);
    res.send(fileBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
}

async function lockMediaFile(req, res) {
  try {
    const { secretKey } = req.body;
    if (secretKey !== 'safeguard123') return res.status(403).json({ error: "Invalid secret key" });

    const med = await Media.findById(req.params.id);
    if (!med) return res.status(404).json({ error: "File not found" });

    med.isLocked = !med.isLocked; // toggle lock
    await med.save();
    return res.json({ success: true, isLocked: med.isLocked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

async function deleteMediaFile(req, res) {
  try {
    const { secretKey } = req.body;
    if (secretKey !== 'safeguard123') return res.status(403).json({ error: "Invalid secret key" });

    const med = await Media.findById(req.params.id);
    if (!med) return res.status(404).json({ error: "File not found" });

    if (med.isLocked) return res.status(403).json({ error: "File is locked and cannot be deleted" });

    await Media.deleteOne({ _id: req.params.id });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { listMyMedia, createMediaRecord, serveMediaFile, lockMediaFile, deleteMediaFile };
