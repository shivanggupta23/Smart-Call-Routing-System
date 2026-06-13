/**
 * logger.js — Lightweight structured logger.
 */

const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

function log(level, message, meta = {}) {
  if (LEVELS[level] > LEVELS[LOG_LEVEL]) return;
  const entry = {
    level: level.toUpperCase(),
    time: new Date().toISOString(),
    message,
    ...meta,
  };
  const output = JSON.stringify(entry);
  if (level === "error") process.stderr.write(output + "\n");
  else process.stdout.write(output + "\n");
}

const logger = {
  info: (msg, meta) => log("info", msg, meta),
  warn: (msg, meta) => log("warn", msg, meta),
  error: (msg, meta) => log("error", msg, meta),
  debug: (msg, meta) => log("debug", msg, meta),
};

module.exports = logger;
