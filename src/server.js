/**
 * server.js — HTTP server entry point.
 */

const app = require("./app");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info("Server started", {
    port: PORT,
    env: process.env.NODE_ENV || "development",
    dashboard: `http://localhost:${PORT}`,
    api: `http://localhost:${PORT}/api`,
    health: `http://localhost:${PORT}/health`,
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received — shutting down gracefully");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received — shutting down");
  server.close(() => process.exit(0));
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});

module.exports = server;
