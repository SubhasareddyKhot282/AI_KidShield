const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Child email = sender email (the mailbox used to send alerts)
    childEmail: { type: String, required: true, unique: true, index: true },

    // Parent email that should receive alerts
    parentEmail: { type: String, default: null },

    // Store encrypted email password/app-password.
    emailPasswordEncrypted: {
      iv: String,
      tag: String,
      ciphertext: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

