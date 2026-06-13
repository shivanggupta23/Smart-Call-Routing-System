/**
 * callService.js — CRUD for active calls and call history.
 */

const { readFile, writeFile } = require("../utils/fileStore");
const { createCall, validateCallPayload } = require("../models/Call");
const logger = require("../utils/logger");

const CALLS_FILE = "calls.json";
const HISTORY_FILE = "history.json";

function getActiveCalls() {
  return readFile(CALLS_FILE, []);
}

function getCallHistory() {
  return readFile(HISTORY_FILE, []);
}

function getCallById(id) {
  const calls = getActiveCalls();
  return calls.find((c) => c.id === id) || null;
}

function createNewCall(payload) {
  const validation = validateCallPayload(payload);
  if (!validation.valid) return { success: false, errors: validation.errors };

  const call = createCall(payload);
  return { success: true, call };
}

/**
 * Persist an active call (after routing decision).
 */
function saveActiveCall(call) {
  const calls = getActiveCalls();
  const idx = calls.findIndex((c) => c.id === call.id);
  if (idx !== -1) {
    calls[idx] = call;
  } else {
    calls.push(call);
  }
  writeFile(CALLS_FILE, calls);
}

/**
 * End a call — move from active to history.
 */
function endCall(callId) {
  const calls = getActiveCalls();
  const idx = calls.findIndex((c) => c.id === callId);
  if (idx === -1) return { success: false, notFound: true };

  const call = calls[idx];
  if (call.status === "ended") return { success: false, message: "Call already ended" };

  call.status = "ended";
  call.endTime = new Date().toISOString();
  if (call.startTime) {
    call.duration = Math.round((new Date(call.endTime) - new Date(call.startTime)) / 1000);
  }

  calls.splice(idx, 1);
  writeFile(CALLS_FILE, calls);

  const history = getCallHistory();
  history.push(call);
  writeFile(HISTORY_FILE, history);

  logger.info("Call ended", { callId, agentId: call.assignedAgent, duration: call.duration });
  return { success: true, call };
}

/**
 * Get call statistics.
 */
function getCallStats() {
  const active = getActiveCalls();
  const history = getCallHistory();

  const byStatus = active.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const avgDuration =
    history.filter((c) => c.duration).reduce((sum, c) => sum + c.duration, 0) /
    (history.filter((c) => c.duration).length || 1);

  return {
    activeCalls: active.length,
    totalEnded: history.length,
    byStatus,
    avgDurationSeconds: Math.round(avgDuration),
  };
}

module.exports = {
  getActiveCalls,
  getCallHistory,
  getCallById,
  createNewCall,
  saveActiveCall,
  endCall,
  getCallStats,
};
