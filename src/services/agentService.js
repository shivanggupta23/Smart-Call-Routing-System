/**
 * agentService.js — CRUD and state management for agents.
 */

const { readFile, writeFile } = require("../utils/fileStore");
const { createAgent, validateAgentPayload } = require("../models/Agent");
const logger = require("../utils/logger");

const FILE = "agents.json";

function getAllAgents() {
  return readFile(FILE, []);
}

function getAgentById(id) {
  const agents = getAllAgents();
  return agents.find((a) => a.id === id) || null;
}

function createNewAgent(payload) {
  const validation = validateAgentPayload(payload);
  if (!validation.valid) return { success: false, errors: validation.errors };

  const agents = getAllAgents();
  const agent = createAgent(payload);
  agents.push(agent);
  writeFile(FILE, agents);
  logger.info("Agent created", { agentId: agent.id, name: agent.name });
  return { success: true, agent };
}

function updateAgent(id, updates) {
  const agents = getAllAgents();
  const idx = agents.findIndex((a) => a.id === id);
  if (idx === -1) return { success: false, notFound: true };

  // Only allow specific fields to be updated
  const allowed = ["name", "skills", "status", "maxCapacity"];
  allowed.forEach((field) => {
    if (updates[field] !== undefined) agents[idx][field] = updates[field];
  });

  writeFile(FILE, agents);
  logger.info("Agent updated", { agentId: id });
  return { success: true, agent: agents[idx] };
}

function deleteAgent(id) {
  const agents = getAllAgents();
  const idx = agents.findIndex((a) => a.id === id);
  if (idx === -1) return { success: false, notFound: true };

  const [removed] = agents.splice(idx, 1);
  writeFile(FILE, agents);
  logger.info("Agent deleted", { agentId: id });
  return { success: true, agent: removed };
}

/**
 * Increment active calls for an agent and update status.
 */
function assignCallToAgent(agentId) {
  const agents = getAllAgents();
  const idx = agents.findIndex((a) => a.id === agentId);
  if (idx === -1) return false;

  agents[idx].activeCalls += 1;
  if (agents[idx].activeCalls >= agents[idx].maxCapacity) {
    agents[idx].status = "busy";
  }
  writeFile(FILE, agents);
  return true;
}

/**
 * Decrement active calls for an agent and update status.
 */
function releaseCallFromAgent(agentId) {
  const agents = getAllAgents();
  const idx = agents.findIndex((a) => a.id === agentId);
  if (idx === -1) return false;

  agents[idx].activeCalls = Math.max(0, agents[idx].activeCalls - 1);
  if (agents[idx].activeCalls < agents[idx].maxCapacity && agents[idx].status !== "offline") {
    agents[idx].status = "available";
  }
  writeFile(FILE, agents);
  logger.info("Agent released", { agentId, activeCalls: agents[idx].activeCalls });
  return true;
}

/**
 * Get agents by status filter.
 */
function getAgentsByStatus(status) {
  return getAllAgents().filter((a) => a.status === status);
}

module.exports = {
  getAllAgents,
  getAgentById,
  createNewAgent,
  updateAgent,
  deleteAgent,
  assignCallToAgent,
  releaseCallFromAgent,
  getAgentsByStatus,
};
