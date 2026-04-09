function requireApiKey(config) {
  return (req, res, next) => {
    const provided = req.header("x-api-key");
    if (!provided || provided !== config.childApiKey) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  };
}

module.exports = { requireApiKey };

