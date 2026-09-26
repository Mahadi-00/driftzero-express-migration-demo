/**
 * 404 Not Found middleware.
 */

"use strict";

/**
 * @param {import("express").Request}  req
 * @param {import("express").Response} res
 */
function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.path}`,
      code: "NOT_FOUND",
    },
  });
}

module.exports = { notFound };
