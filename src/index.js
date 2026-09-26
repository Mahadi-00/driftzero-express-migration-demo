/**
 * Application entry point — Express 4 task-management API.
 *
 * DriftZero P33 migration fixture.
 * Source: Express 4.x
 * Target: Express 5.x
 *
 * Express 4 patterns present (migration surfaces):
 *   - require('express-async-errors') for async error propagation
 *   - Express Router with app.param() usage
 *   - res.json() with multiple arguments pattern (removed in Express 5)
 *   - Manual Promise rejection handling (async handler wrapping)
 *   - router.param() callbacks with 4 arguments
 *   - body-parser required separately (Express 4 does not bundle it)
 *   - express.Router() with mergeParams option
 *   - res.sendfile() (deprecated in Express 4, removed in Express 5)
 */

"use strict";

require("dotenv").config();

// In Express 4, async errors are NOT automatically passed to next().
// This package patches Express to do so — in Express 5 this is built-in.
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const bodyParser = require("body-parser");

const tasksRouter = require("./routes/tasks");
const projectsRouter = require("./routes/projects");
const usersRouter = require("./routes/users");
const { errorHandler } = require("./middleware/errorHandler");
const { notFound } = require("./middleware/notFound");

const app = express();
const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// Security & logging middleware
// ---------------------------------------------------------------------------

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}));
app.use(morgan("dev"));

// ---------------------------------------------------------------------------
// Body parsing — Express 4 requires body-parser as a separate package.
// In Express 5, express.json() and express.urlencoded() ship with Express.
// ---------------------------------------------------------------------------

// MIGRATION SURFACE: Express 4 uses body-parser directly.
// Express 5: these become express.json() / express.urlencoded() built-in.
app.use(bodyParser.json({ limit: "1mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0", timestamp: new Date().toISOString() });
});

app.use("/api/tasks", tasksRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/users", usersRouter);

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

app.use(notFound);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start server (only when run directly, not during tests)
// ---------------------------------------------------------------------------

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`[app] DriftZero demo API running on port ${PORT}`);
  });

  // MIGRATION SURFACE: Express 4 does not automatically handle unhandled rejections
  // in route handlers without express-async-errors or manual wrapping.
  // Express 5 handles rejected Promises natively.
  process.on("unhandledRejection", (reason) => {
    console.error("[app] Unhandled rejection:", reason);
    server.close(() => process.exit(1));
  });
}

module.exports = app;
