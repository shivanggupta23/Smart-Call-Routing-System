/**
 * routingController.js — Manual routing trigger.
 */

const routingService = require("../services/routingService");
const { success } = require("../utils/response");

const processQueue = (req, res) => {
  const result = routingService.processAllQueued();
  return success(res, result, `Queue processing complete. ${result.processed} call(s) processed.`);
};

module.exports = { processQueue };
