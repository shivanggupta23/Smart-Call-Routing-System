const express = require("express");
const router = express.Router();
const {
  listAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  getAgentStatus,
} = require("../controllers/agentController");

router.get("/status", getAgentStatus);
router.get("/", listAgents);
router.get("/:id", getAgent);
router.post("/", createAgent);
router.put("/:id", updateAgent);
router.delete("/:id", deleteAgent);

module.exports = router;
