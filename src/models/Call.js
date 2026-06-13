/**
 * Call.js — Call model factory and validators.
 */

const { v4: uuidv4 } = require("uuid");
const { VALID_SKILLS } = require("./Agent");

const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];
const VALID_STATUSES = ["queued", "active", "waiting", "fallback", "ended"];

/**
 * Create a new Call object with defaults.
 */
function createCall({ customerName, requiredSkill, priority = "medium" }) {
  return {
    id: `call-${uuidv4().split("-")[0]}`,
    customerName,
    requiredSkill,
    priority,
    status: "queued",
    assignedAgent: null,
    startTime: null,
    endTime: null,
    waitTime: null,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Validate call creation payload.
 */
function validateCallPayload({ customerName, requiredSkill, priority }) {
  const errors = [];
  if (!customerName || typeof customerName !== "string" || customerName.trim().length < 2) {
    errors.push("customerName must be a non-empty string of at least 2 characters");
  }
  if (!requiredSkill || !VALID_SKILLS.includes(requiredSkill)) {
    errors.push(`requiredSkill must be one of: ${VALID_SKILLS.join(", ")}`);
  }
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    errors.push(`priority must be one of: ${VALID_PRIORITIES.join(", ")}`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Priority weight for queue ordering (higher = served sooner).
 */
const PRIORITY_WEIGHT = { urgent: 4, high: 3, medium: 2, low: 1 };

module.exports = { createCall, validateCallPayload, VALID_PRIORITIES, VALID_STATUSES, PRIORITY_WEIGHT };
