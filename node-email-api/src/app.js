const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const config = require("./config");

const alertsRoutes = require("./routes/alertsRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const healthRoutes = require("./routes/healthRoutes");
const configRoutes = require("./routes/configRoutes");
const authRoutes = require("./routes/authRoutes");

function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet({
    contentSecurityPolicy: false
  }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  app.use(morgan("dev"));

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 200,
    })
  );

  // Serve frontend + uploaded files.
  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

  app.use("/api/config", configRoutes(config));
  app.use("/api/alerts", alertsRoutes(config));
  app.use("/api/media", mediaRoutes(config));
  app.use("/api/auth", authRoutes());
  app.use("/health", healthRoutes());

  // Catch-all for frontend routes (Express 5 path-to-regexp doesn't like "*").
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "login.html"));
  });

  // Connect to Mongo once at startup.
  mongoose
    .connect(config.mongodbUri)
    .then(() => {
      // eslint-disable-next-line no-console
      console.log("MongoDB connected");
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("MongoDB connection failed:", err);
    });

  return app;
}

module.exports = { createApp };

