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
    }))
  );
}

async function createMediaRecord(req, res) {
  const childEmail = String(req.body.childEmail || "").trim().toLowerCase();
  const kind = ensureKind(req.body.kind);
  if (!childEmail) return res.status(400).json({ error: "Missing childEmail" });
  if (!kind) return res.status(400).json({ error: "Invalid kind" });
  if (!req.file) return res.status(400).json({ error: "Missing file" });

  // multer memoryStorage kept the file in RAM
  const rec = await Media.create({
    childEmail,
    kind,
    originalName: req.file.originalname || "upload",
    mimeType: req.file.mimetype || "",
    fileData: req.file.buffer, // Save binary data directly to MongoDB
    fileUrl: "", // Temporary, will update below with the document ID
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
    
    // Serve the binary Buffer using accurate mimetype header
    res.set("Content-Type", med.mimeType || "application/octet-stream");
    res.send(med.fileData);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
}

module.exports = { listMyMedia, createMediaRecord, serveMediaFile };

