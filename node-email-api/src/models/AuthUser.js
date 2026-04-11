const mongoose = require("mongoose");

const authUserSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['parent', 'child'], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuthUser", authUserSchema);
