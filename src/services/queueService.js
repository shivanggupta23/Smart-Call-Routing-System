/**
 * queueService.js — Manages the waiting queue and fallback queue.
 * Priority-ordered: urgent > high > medium > low.
 */

const { readFile, writeFile } = require("../utils/fileStore");
const { PRIORITY_WEIGHT } = require("../models/Call");
const logger = require("../utils/logger");

const FILE = "queue.json";

function getQueue() {
  return readFile(FILE, { waiting: [], fallback: [] });
}

function saveQueue(queue) {
  writeFile(FILE, queue);
}

/**
 * Add a call to the waiting queue (skill exists but agents busy).
 */
function enqueueWaiting(call) {
  const queue = getQueue();
  call.status = "waiting";
  call.queuedAt = new Date().toISOString();
  queue.waiting.push(call);
  // Sort by priority (descending) then by createdAt (ascending — FIFO within same priority)
  queue.waiting.sort((a, b) => {
    const pw = (PRIORITY_WEIGHT[b.priority] || 2) - (PRIORITY_WEIGHT[a.priority] || 2);
    if (pw !== 0) return pw;
    return new Date(a.queuedAt) - new Date(b.queuedAt);
  });
  saveQueue(queue);
  logger.info("Call added to waiting queue", { callId: call.id, priority: call.priority });
}

/**
 * Add a call to the fallback queue (no agent with matching skill found).
 */
function enqueueFallback(call) {
  const queue = getQueue();
  call.status = "fallback";
  call.queuedAt = new Date().toISOString();
  queue.fallback.push(call);
  saveQueue(queue);
  logger.info("Call added to fallback queue", { callId: call.id, skill: call.requiredSkill });
}

/**
 * Dequeue the highest-priority call from waiting for a given skill.
 */
function dequeueWaitingForSkill(skill) {
  const queue = getQueue();
  const idx = queue.waiting.findIndex((c) => c.requiredSkill === skill);
  if (idx === -1) return null;
  const [call] = queue.waiting.splice(idx, 1);
  saveQueue(queue);
  return call;
}

/**
 * Remove a specific call from any queue by call id.
 */
function removeFromQueue(callId) {
  const queue = getQueue();
  const wIdx = queue.waiting.findIndex((c) => c.id === callId);
  if (wIdx !== -1) { queue.waiting.splice(wIdx, 1); saveQueue(queue); return true; }
  const fIdx = queue.fallback.findIndex((c) => c.id === callId);
  if (fIdx !== -1) { queue.fallback.splice(fIdx, 1); saveQueue(queue); return true; }
  return false;
}

/**
 * Get full queue snapshot.
 */
function getQueueSnapshot() {
  return getQueue();
}

/**
 * Get queue stats.
 */
function getQueueStats() {
  const queue = getQueue();
  return {
    waitingCount: queue.waiting.length,
    fallbackCount: queue.fallback.length,
    totalQueued: queue.waiting.length + queue.fallback.length,
  };
}

module.exports = {
  enqueueWaiting,
  enqueueFallback,
  dequeueWaitingForSkill,
  removeFromQueue,
  getQueueSnapshot,
  getQueueStats,
};
