const express = require("express");
const router = express.Router();
const { listCalls, getCallHistory, createCall, endCall } = require("../controllers/callController");

router.get("/history", getCallHistory);
router.get("/", listCalls);
router.post("/", createCall);
router.post("/:id/end", endCall);

module.exports = router;
