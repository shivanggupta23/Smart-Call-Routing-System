/**
 * dashboardController.js — Aggregated stats for the dashboard.
 */

const agentService = require("../services/agentService");
const callService = require("../services/callService");
const queueService = require("../services/queueService");
const { success } = require("../utils/response");

const getStats = (req, res) => {
  const agents = agentService.getAllAgents();
  const callStats = callService.getCallStats();
  const queueStats = queueService.getQueueStats();
  const activeCalls = callService.getActiveCalls();

  const agentStats = {
    total: agents.length,
    available: agents.filter((a) => a.status === "available").length,
    busy: agents.filter((a) => a.status === "busy").length,
    offline: agents.filter((a) => a.status === "offline").length,
  };

  // Skill distribution
  const skillDist = {};
  agents.forEach((a) =>
    a.skills.forEach((s) => {
      skillDist[s] = (skillDist[s] || 0) + 1;
    })
  );

  // Priority distribution across active calls
  const priorityDist = {};
  activeCalls.forEach((c) => {
    priorityDist[c.priority] = (priorityDist[c.priority] || 0) + 1;
  });

  return success(
    res,
    {
      agents: agentStats,
      calls: callStats,
      queue: queueStats,
      skillDistribution: skillDist,
      priorityDistribution: priorityDist,
      recentCalls: activeCalls.slice(-5).reverse(),
      timestamp: new Date().toISOString(),
    },
    "Dashboard stats retrieved"
  );
};

module.exports = { getStats };
