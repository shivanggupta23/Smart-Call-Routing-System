const express = require("express");
const router = express.Router();
const { getQueue } = require("../controllers/queueController");

router.get("/", getQueue);

module.exports = router;
