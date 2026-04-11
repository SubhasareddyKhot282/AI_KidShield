const AuthUser = require("../models/AuthUser");
const jwt = require("jsonwebtoken");
const config = require("../config");

// Basic auth controller purely to validate registration/login

async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password || !role) return res.status(400).json({ error: "Missing required fields" });

    const existing = await AuthUser.findOne({ email });
    if (existing) return res.status(400).json({ error: "User already exists with this email" });

    const user = new AuthUser({ name, email, password, role });
    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, config.tokenEncryptionKey || 'secret', { expiresIn: '7d' });
    res.json({ success: true, token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Auth register error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function login(req, res) {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) return res.status(400).json({ error: "Missing required fields" });

    const user = await AuthUser.findOne({ email, role });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials or mismatched role" });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, config.tokenEncryptionKey || 'secret', { expiresIn: '7d' });
    res.json({ success: true, token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Auth login error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { register, login };
