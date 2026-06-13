/**
 * app.js — Express app configuration. Separated from server.js for testability.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const notFoundHandler = require("./middleware/notFound");

const agentRoutes = require("./routes/agentRoutes");
const callRoutes = require("./routes/callRoutes");
const queueRoutes = require("./routes/queueRoutes");
const routingRoutes = require("./routes/routingRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// ─── Core Middleware ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(requestLogger);

// ─── Static Dashboard ─────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../dashboard")));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "smart-call-routing-system",
    version: "1.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/agents", agentRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/routing", routingRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ─── SPA Fallback ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../dashboard/index.html"));
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
