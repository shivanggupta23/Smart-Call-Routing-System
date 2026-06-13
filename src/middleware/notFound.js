/**
 * notFound.js — 404 handler for unmatched routes.
 */

module.exports = function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
};
