/**
 * response.js — Standardized API response helpers.
 */

/**
 * Send a success response.
 */
function success(res, data, message = "OK", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Send an error response.
 */
function error(res, message = "Internal Server Error", statusCode = 500, details = null) {
  const payload = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };
  if (details) payload.details = details;
  return res.status(statusCode).json(payload);
}

/**
 * Send a 404 not found response.
 */
function notFound(res, resource = "Resource") {
  return error(res, `${resource} not found`, 404);
}

/**
 * Send a 400 bad request response.
 */
function badRequest(res, message = "Bad request", details = null) {
  return error(res, message, 400, details);
}

module.exports = { success, error, notFound, badRequest };
