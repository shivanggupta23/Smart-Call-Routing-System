/**
 * errorHandler.js — Centralized Express error handling middleware.
 */

const logger = require("../utils/logger");

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  logger.error("Unhandled error", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    timestamp: new Date().toISOString(),
  });
};
