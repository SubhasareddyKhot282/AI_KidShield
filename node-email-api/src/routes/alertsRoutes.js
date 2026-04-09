const express = require("express");
const requireApiKey = require("../middleware/requireApiKey");
const alertsController = require("../controllers/alertsController");

function alertsRoutes(config) {
  const router = express.Router();
  const apiKeyMw = requireApiKey.requireApiKey(config);

  router.post("/send", apiKeyMw, (req, res) => alertsController.sendAlert(req, res));

  return router;
}

module.exports = alertsRoutes;

