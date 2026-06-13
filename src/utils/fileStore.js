/**
 * fileStore.js — Simple JSON file-based persistence layer.
 * Provides read/write helpers with basic error handling.
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.resolve(process.env.DATA_DIR || "./data");

/**
 * Read JSON from a data file. Returns empty default if file missing.
 * @param {string} filename - e.g. "agents.json"
 * @param {*} defaultValue - returned if file doesn't exist
 */
function readFile(filename, defaultValue = []) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[FileStore] Error reading ${filename}:`, err.message);
    return defaultValue;
  }
}

/**
 * Write data as JSON to a data file (synchronous, atomic-ish via temp file).
 * @param {string} filename
 * @param {*} data
 */
function writeFile(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  const tmpPath = filePath + ".tmp";
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    console.error(`[FileStore] Error writing ${filename}:`, err.message);
    throw err;
  }
}

module.exports = { readFile, writeFile };
