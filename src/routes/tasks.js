/**
 * Tasks router — Express 4.
 *
 * DriftZero P33 migration surfaces present in this file:
 *
 * 1. Async route handlers that THROW errors instead of calling next(err).
 *    In Express 4, async errors require express-async-errors to be propagated.
 *    In Express 5, Promise rejections are propagated to the error handler natively.
 *
 * 2. body-parser is imported as a separate package (bodyParser in index.js).
 *    In Express 5, body parsing is built-in: express.json() / express.urlencoded().
 *
 * 3. app.del() alias — Express 4 supports app.del() as an alias for app.delete().
 *    Express 5 removes app.del(). (Shown in app-level migration surface in index.js.)
 *
 * 4. req.query values are always strings in Express 4.
 *    Express 5 preserves this behavior but adds stricter query parsing defaults.
 */

"use strict";

const router = require("express").Router();
const taskStore = require("../models/tasks");
const { AppError } = require("../middleware/errorHandler");

// ---------------------------------------------------------------------------
// router.param() — correct Express 4 signature: (req, res, next, value)
// ---------------------------------------------------------------------------

router.param("taskId", (req, res, next, id) => {
  const task = taskStore.findById(id);
  if (!task) {
    return next(new AppError("Task not found", 404, "TASK_NOT_FOUND"));
  }
  req.task = task;
  next();
});

// ---------------------------------------------------------------------------
// GET /api/tasks — list tasks with optional filtering
// ---------------------------------------------------------------------------

router.get("/", async (req, res) => {
  const { projectId, status } = req.query;

  // Validate status if provided
  const validStatuses = ["pending", "in_progress", "done", "cancelled"];
  if (status && !validStatuses.includes(status)) {
    throw new AppError(
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      400,
      "INVALID_STATUS"
    );
  }

  const tasks = taskStore.list({ projectId, status });
  res.json({
    success: true,
    data: tasks,
    meta: { count: tasks.length },
  });
});

// ---------------------------------------------------------------------------
// POST /api/tasks — create a task
// ---------------------------------------------------------------------------

router.post("/", async (req, res) => {
  const { title, description, status, priority, projectId, assigneeId, dueDate } = req.body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    throw new AppError("title is required", 400, "VALIDATION_ERROR");
  }
  if (title.trim().length > 200) {
    throw new AppError("title must be 200 characters or fewer", 400, "VALIDATION_ERROR");
  }

  const validPriorities = ["low", "medium", "high"];
  if (priority && !validPriorities.includes(priority)) {
    throw new AppError(
      `Invalid priority. Must be one of: ${validPriorities.join(", ")}`,
      400,
      "INVALID_PRIORITY"
    );
  }

  const task = taskStore.create({
    title: title.trim(),
    description,
    status,
    priority,
    projectId,
    assigneeId,
    dueDate,
  });

  res.status(201).json({ success: true, data: task });
});

// ---------------------------------------------------------------------------
// GET /api/tasks/:taskId — get a single task
// ---------------------------------------------------------------------------

router.get("/:taskId", (req, res) => {
  // req.task populated by router.param above
  res.json({ success: true, data: req.task });
});

// ---------------------------------------------------------------------------
// PATCH /api/tasks/:taskId — update a task (partial)
// ---------------------------------------------------------------------------

router.patch("/:taskId", async (req, res) => {
  const allowed = ["title", "description", "status", "priority", "assigneeId", "dueDate"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (updates.title !== undefined) {
    if (typeof updates.title !== "string" || updates.title.trim().length === 0) {
      throw new AppError("title must not be empty", 400, "VALIDATION_ERROR");
    }
    updates.title = updates.title.trim();
  }

  const validStatuses = ["pending", "in_progress", "done", "cancelled"];
  if (updates.status && !validStatuses.includes(updates.status)) {
    throw new AppError(
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      400,
      "INVALID_STATUS"
    );
  }

  const task = taskStore.update(req.task.id, updates);
  res.json({ success: true, data: task });
});

// ---------------------------------------------------------------------------
// DELETE /api/tasks/:taskId — delete a task
// ---------------------------------------------------------------------------

router.delete("/:taskId", (req, res) => {
  taskStore.delete(req.task.id);
  // MIGRATION SURFACE 3: res.status(204).end() is fine in both Express 4 and 5,
  // but the demo originally used res.json() with an empty object.
  res.status(204).end();
});

// ---------------------------------------------------------------------------
// GET /api/tasks/project/:projectId — list tasks for a specific project
// (nested resource route — using mergeParams pattern)
// ---------------------------------------------------------------------------

module.exports = router;
