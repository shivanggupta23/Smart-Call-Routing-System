/**
 * requestLogger.js — HTTP request logging middleware.
 */

const logger = require("../utils/logger");

module.exports = function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info("HTTP", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip,
    });
  });
  next();
};
