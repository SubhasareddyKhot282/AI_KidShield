const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const requireApiKey = require("../middleware/requireApiKey");

const config = require("../config");
const mediaController = require("../controllers/mediaController");

function mediaRoutes(appConfig) {
  const router = express.Router();

  const apiKeyMw = requireApiKey.requireApiKey(appConfig);

  const storage = multer.memoryStorage();

  const upload = multer({
    storage,
    limits: {
      fileSize: 15 * 1024 * 1024, // 15MB
    },
    fileFilter: (req, file, cb) => {
      const kindRaw = String(req.body.kind || "").trim();
      const kind = kindRaw === "screenshot" || kindRaw === "audio" ? kindRaw : null;
      if (!kind) return cb(new Error("Invalid kind"));

      if (kind === "screenshot") {
        const isImg = /^image\//.test(file.mimetype);
        return cb(null, isImg);
      }
      if (kind === "audio") {
        const isAudio = /^audio\//.test(file.mimetype) || file.mimetype === "audio/wav" || file.mimetype === "audio/mpeg";
        return cb(null, isAudio);
      }

      return cb(null, false);
    },
  });

  router.post("/upload", apiKeyMw, upload.single("file"), (req, res) => {
    return mediaController.createMediaRecord(req, res);
  });

  // Simple: fetch by childEmail query param (no auth)
  router.get("/list", (req, res) => mediaController.listMyMedia(req, res));

  // Serve db file directly
  router.get("/file/:id", (req, res) => mediaController.serveMediaFile(req, res));

  // Lock and Delete (Requires body.secretKey)
  router.post("/:id/lock", (req, res) => mediaController.lockMediaFile(req, res));
  router.delete("/:id", (req, res) => mediaController.deleteMediaFile(req, res));

  return router;
}

module.exports = mediaRoutes;

