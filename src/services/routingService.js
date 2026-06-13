/**
 * routingService.js — Core routing engine.
 *
 * Algorithm:
 *  1. Find agents with matching skill.
 *  2. Filter to available agents under maxCapacity.
 *  3. Load-balance: pick least loaded (fewest activeCalls).
 *  4. If all matching agents are at capacity → waiting queue.
 *  5. If no matching skill agent exists → fallback queue.
 *  6. On call end, auto-process queued calls for freed agent's skills.
 */

const agentService = require("./agentService");
const callService = require("./callService");
const queueService = require("./queueService");
const logger = require("../utils/logger");

/**
 * Route a single call. Returns routing result.
 */
function routeCall(call) {
  const agents = agentService.getAllAgents();

  // Step 1: Find agents with matching skill
  const skillMatch = agents.filter(
    (a) => a.skills.includes(call.requiredSkill) && a.status !== "offline"
  );

  if (skillMatch.length === 0) {
    // Fallback queue — no agent handles this skill
    queueService.enqueueFallback(call);
    callService.saveActiveCall({ ...call, status: "fallback" });
    return { routed: false, reason: "fallback", queue: "fallback" };
  }

  // Step 2: Find available agents (not at max capacity)
  const available = skillMatch.filter(
    (a) => a.status === "available" && a.activeCalls < a.maxCapacity
  );

  if (available.length === 0) {
    // Waiting queue — skill exists but all busy
    queueService.enqueueWaiting(call);
    callService.saveActiveCall({ ...call, status: "waiting" });
    return { routed: false, reason: "waiting", queue: "waiting" };
  }

  // Step 3: Load balance — pick least loaded agent
  available.sort((a, b) => a.activeCalls - b.activeCalls);
  const selectedAgent = available[0];

  // Step 4: Assign call
  const now = new Date().toISOString();
  const assignedCall = {
    ...call,
    status: "active",
    assignedAgent: selectedAgent.id,
    startTime: now,
  };

  agentService.assignCallToAgent(selectedAgent.id);
  callService.saveActiveCall(assignedCall);

  logger.info("Call routed", {
    callId: call.id,
    agentId: selectedAgent.id,
    skill: call.requiredSkill,
    agentLoad: selectedAgent.activeCalls + 1,
  });

  return {
    routed: true,
    call: assignedCall,
    agent: agentService.getAgentById(selectedAgent.id),
  };
}

/**
 * Process queued calls after an agent becomes available.
 * Called when a call ends.
 */
function processQueueForAgent(agentId) {
  const agent = agentService.getAgentById(agentId);
  if (!agent || agent.status === "offline") return [];

  const processed = [];

  while (agent.activeCalls < agent.maxCapacity) {
    // Try to dequeue a waiting call matching any of agent's skills
    let dequeuedCall = null;
    for (const skill of agent.skills) {
      dequeuedCall = queueService.dequeueWaitingForSkill(skill);
      if (dequeuedCall) break;
    }
    if (!dequeuedCall) break;

    const result = routeCall(dequeuedCall);
    if (result.routed) {
      processed.push(result);
      // Re-read agent to get updated activeCalls
      const refreshed = agentService.getAgentById(agentId);
      if (!refreshed || refreshed.activeCalls >= refreshed.maxCapacity) break;
    } else {
      break;
    }
  }

  return processed;
}

/**
 * Force re-process entire waiting queue.
 * Useful for manual trigger via /api/routing/process.
 */
function processAllQueued() {
  const snapshot = queueService.getQueueSnapshot();
  const results = [];

  // Process waiting queue
  const waiting = [...snapshot.waiting];
  for (const call of waiting) {
    queueService.removeFromQueue(call.id);
    const result = routeCall(call);
    results.push({ callId: call.id, ...result });
  }

  return { processed: results.length, results };
}

module.exports = { routeCall, processQueueForAgent, processAllQueued };
