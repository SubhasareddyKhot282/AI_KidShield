const crypto = require("crypto");

// AES-256-GCM wrapper for encrypting tokens at rest.
function getKey() {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) throw new Error("TOKEN_ENCRYPTION_KEY is required");
  return crypto.createHash("sha256").update(secret).digest(); // 32 bytes
}

function encryptString(plain) {
  const key = getKey();
  const iv = crypto.randomBytes(12); // recommended size for GCM

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

function decryptString(payload) {
  const key = getKey();
  if (!payload || !payload.iv || !payload.tag || !payload.ciphertext) return null;

  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  return plain;
}

module.exports = { encryptString, decryptString };

