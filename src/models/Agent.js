/**
 * Agent.js — Agent model factory and validators.
 */

const { v4: uuidv4 } = require("uuid");

const VALID_STATUSES = ["available", "busy", "offline"];
const VALID_SKILLS = ["billing", "technical", "sales", "general", "networking"];

/**
 * Create a new Agent object with defaults.
 */
function createAgent({ name, skills, maxCapacity = 3 }) {
  return {
    id: `agent-${uuidv4().split("-")[0]}`,
    name,
    skills,
    status: "available",
    activeCalls: 0,
    maxCapacity,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Validate agent creation payload.
 * Returns { valid: boolean, errors: string[] }
 */
function validateAgentPayload({ name, skills, maxCapacity }) {
  const errors = [];
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push("name must be a non-empty string of at least 2 characters");
  }
  if (!Array.isArray(skills) || skills.length === 0) {
    errors.push("skills must be a non-empty array");
  } else {
    const invalid = skills.filter((s) => !VALID_SKILLS.includes(s));
    if (invalid.length > 0) {
      errors.push(`invalid skills: ${invalid.join(", ")}. Valid: ${VALID_SKILLS.join(", ")}`);
    }
  }
  if (maxCapacity !== undefined) {
    const cap = Number(maxCapacity);
    if (isNaN(cap) || cap < 1 || cap > 10) {
      errors.push("maxCapacity must be a number between 1 and 10");
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validate a status update.
 */
function validateStatusUpdate(status) {
  if (!VALID_STATUSES.includes(status)) {
    return { valid: false, errors: [`status must be one of: ${VALID_STATUSES.join(", ")}`] };
  }
  return { valid: true, errors: [] };
}

module.exports = { createAgent, validateAgentPayload, validateStatusUpdate, VALID_SKILLS, VALID_STATUSES };
