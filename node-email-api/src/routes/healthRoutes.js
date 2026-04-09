const express = require("express");

function healthRoutes() {
  const router = express.Router();
  router.get("/", (req, res) => {
    res.json({ status: "ok" });
  });
  return router;
}

module.exports = healthRoutes;

