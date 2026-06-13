/**
 * agentController.js — HTTP handlers for agent endpoints.
 */

const agentService = require("../services/agentService");
const { success, error, notFound, badRequest } = require("../utils/response");
const { validateAgentPayload, validateStatusUpdate } = require("../models/Agent");

const listAgents = (req, res) => {
  const { status, skill } = req.query;
  let agents = agentService.getAllAgents();

  if (status) agents = agents.filter((a) => a.status === status);
  if (skill) agents = agents.filter((a) => a.skills.includes(skill));

  return success(res, { agents, total: agents.length }, "Agents retrieved");
};

const getAgent = (req, res) => {
  const agent = agentService.getAgentById(req.params.id);
  if (!agent) return notFound(res, "Agent");
  return success(res, { agent }, "Agent retrieved");
};

const createAgent = (req, res) => {
  const result = agentService.createNewAgent(req.body);
  if (!result.success) return badRequest(res, "Validation failed", result.errors);
  return success(res, { agent: result.agent }, "Agent created", 201);
};

const updateAgent = (req, res) => {
  // Validate status if present
  if (req.body.status) {
    const validation = validateStatusUpdate(req.body.status);
    if (!validation.valid) return badRequest(res, "Invalid status", validation.errors);
  }
  // Validate skills if present
  if (req.body.skills || req.body.name || req.body.maxCapacity) {
    const validation = validateAgentPayload({
      name: req.body.name || "placeholder",
      skills: req.body.skills || ["general"],
      maxCapacity: req.body.maxCapacity,
    });
    if (!validation.valid && req.body.skills) {
      return badRequest(res, "Validation failed", validation.errors);
    }
  }

  const result = agentService.updateAgent(req.params.id, req.body);
  if (!result.success && result.notFound) return notFound(res, "Agent");
  return success(res, { agent: result.agent }, "Agent updated");
};

const deleteAgent = (req, res) => {
  const result = agentService.deleteAgent(req.params.id);
  if (!result.success && result.notFound) return notFound(res, "Agent");
  return success(res, { agent: result.agent }, "Agent deleted");
};

const getAgentStatus = (req, res) => {
  const agents = agentService.getAllAgents();
  const summary = {
    available: agents.filter((a) => a.status === "available"),
    busy: agents.filter((a) => a.status === "busy"),
    offline: agents.filter((a) => a.status === "offline"),
  };
  return success(res, summary, "Agent status retrieved");
};

module.exports = { listAgents, getAgent, createAgent, updateAgent, deleteAgent, getAgentStatus };
