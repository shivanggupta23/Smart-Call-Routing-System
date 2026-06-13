/**
 * queueController.js — Queue read endpoints.
 */

const queueService = require("../services/queueService");
const { success } = require("../utils/response");

const getQueue = (req, res) => {
  const snapshot = queueService.getQueueSnapshot();
  const stats = queueService.getQueueStats();
  return success(res, { ...snapshot, stats }, "Queue retrieved");
};

module.exports = { getQueue };
