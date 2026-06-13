const express = require("express");
const router = express.Router();
const { processQueue } = require("../controllers/routingController");

router.post("/process", processQueue);

module.exports = router;
