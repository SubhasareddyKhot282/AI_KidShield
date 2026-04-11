const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    childEmail: { type: String, required: true, index: true },
    kind: { type: String, enum: ["screenshot", "audio"], required: true, index: true },

    originalName: { type: String, default: "" },
    mimeType: { type: String, default: "" },

    // Persisted so frontend can render via returned URL.
    fileData: { type: Buffer, required: true },
    fileUrl: { type: String, required: true },
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Media", mediaSchema);

