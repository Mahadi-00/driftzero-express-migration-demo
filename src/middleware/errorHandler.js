/**
 * Centralized error handling middleware — Express 4.
 *
 * DriftZero P33 migration surfaces:
 *
 * 1. Error handler has the standard 4-argument signature (err, req, res, next).
 *    This is unchanged between Express 4 and 5.
 *
 * 2. AppError class — application-level domain errors.
 *    Used across all route handlers with throw (via express-async-errors in Express 4).
 */

"use strict";

/**
 * Application-level error class.
 * Used with throw in async handlers (express-async-errors patches Express 4 to catch these).
 * Express 5 handles thrown errors from async handlers natively.
 */
class AppError extends Error {
  /**
   * @param {string} message   Human-readable message (safe to send to clients)
   * @param {number} statusCode HTTP status code
   * @param {string} code       Machine-readable error code
   */
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express 4 error-handling middleware.
 * Must have exactly 4 parameters — this signature is required by Express.
 *
 * @param {Error}  err
 * @param {import("express").Request}  req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Log to stderr in non-test environments
  if (process.env.NODE_ENV !== "test") {
    console.error(`[error] ${req.method} ${req.path}:`, err.message);
    if (err.stack && process.env.NODE_ENV === "development") {
      console.error(err.stack);
    }
  }

  const statusCode = err.statusCode || err.status || 500;
  const code       = err.code       || "INTERNAL_ERROR";

  res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode < 500 ? err.message : "Internal server error",
      code,
    },
  });
}

module.exports = { AppError, errorHandler };
