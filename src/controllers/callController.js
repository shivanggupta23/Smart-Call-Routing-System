/**
 * callController.js — HTTP handlers for call endpoints.
 */

const callService = require("../services/callService");
const routingService = require("../services/routingService");
const agentService = require("../services/agentService");
const { success, error, notFound, badRequest } = require("../utils/response");

const listCalls = (req, res) => {
  const { status, agentId } = req.query;
  let calls = callService.getActiveCalls();

  if (status) calls = calls.filter((c) => c.status === status);
  if (agentId) calls = calls.filter((c) => c.assignedAgent === agentId);

  return success(res, { calls, total: calls.length }, "Active calls retrieved");
};

const getCallHistory = (req, res) => {
  const history = callService.getCallHistory();
  return success(res, { calls: history, total: history.length }, "Call history retrieved");
};

const createCall = (req, res) => {
  const result = callService.createNewCall(req.body);
  if (!result.success) return badRequest(res, "Validation failed", result.errors);

  // Route the call immediately
  const routingResult = routingService.routeCall(result.call);

  const responseData = {
    call: routingResult.call || { ...result.call, status: routingResult.queue },
    routing: {
      routed: routingResult.routed,
      reason: routingResult.reason || "assigned",
      queue: routingResult.queue || null,
      agent: routingResult.agent || null,
    },
  };

  const message = routingResult.routed
    ? `Call routed to agent ${routingResult.agent?.name}`
    : routingResult.reason === "fallback"
    ? "No agent with required skill — added to fallback queue"
    : "All matching agents busy — added to waiting queue";

  return success(res, responseData, message, 201);
};

const endCall = (req, res) => {
  const result = callService.endCall(req.params.id);
  if (!result.success && result.notFound) return notFound(res, "Call");
  if (!result.success) return badRequest(res, result.message);

  // Free the agent and try to process queued calls
  if (result.call.assignedAgent) {
    agentService.releaseCallFromAgent(result.call.assignedAgent);
    const queued = routingService.processQueueForAgent(result.call.assignedAgent);
    return success(
      res,
      { call: result.call, queueProcessed: queued.length },
      `Call ended. ${queued.length} queued call(s) assigned.`
    );
  }

  return success(res, { call: result.call }, "Call ended");
};

module.exports = { listCalls, getCallHistory, createCall, endCall };
