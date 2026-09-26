/**
 * Projects router — Express 4.
 *
 * DriftZero P33 migration surfaces:
 *
 * 1. Async handlers using express-async-errors (implicit try/catch).
 *    Express 5 propagates rejected Promises natively — no patch needed.
 *
 * 2. body-parser used as a separate package (see index.js).
 *    Express 5 ships body parsing built-in.
 */

"use strict";

const router = require("express").Router();
const projectStore = require("../models/projects");
const taskStore    = require("../models/tasks");
const { AppError } = require("../middleware/errorHandler");

// router.param() — correct Express 4 signature: (req, res, next, value)
router.param("projectId", (req, res, next, id) => {
  const project = projectStore.findById(id);
  if (!project) {
    return next(new AppError("Project not found", 404, "PROJECT_NOT_FOUND"));
  }
  req.project = project;
  next();
});

// ---------------------------------------------------------------------------
// GET /api/projects — list projects
// ---------------------------------------------------------------------------

router.get("/", async (_req, res) => {
  const projects = projectStore.list();
  res.json({ success: true, data: projects, meta: { count: projects.length } });
});

// ---------------------------------------------------------------------------
// POST /api/projects — create a project
// ---------------------------------------------------------------------------

router.post("/", async (req, res) => {
  const { name, description, ownerId } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    throw new AppError("name is required", 400, "VALIDATION_ERROR");
  }
  if (!ownerId) {
    throw new AppError("ownerId is required", 400, "VALIDATION_ERROR");
  }

  const project = projectStore.create({ name: name.trim(), description, ownerId });
  res.status(201).json({ success: true, data: project });
});

// ---------------------------------------------------------------------------
// GET /api/projects/:projectId — get a single project
// ---------------------------------------------------------------------------

router.get("/:projectId", (req, res) => {
  res.json({ success: true, data: req.project });
});

// ---------------------------------------------------------------------------
// PATCH /api/projects/:projectId — update a project
// ---------------------------------------------------------------------------

router.patch("/:projectId", async (req, res) => {
  const allowed = ["name", "description", "status"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (updates.name !== undefined) {
    if (typeof updates.name !== "string" || updates.name.trim().length === 0) {
      throw new AppError("name must not be empty", 400, "VALIDATION_ERROR");
    }
    updates.name = updates.name.trim();
  }

  const validStatuses = ["active", "archived", "completed"];
  if (updates.status && !validStatuses.includes(updates.status)) {
    throw new AppError(
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      400,
      "INVALID_STATUS"
    );
  }

  const project = projectStore.update(req.project.id, updates);
  res.json({ success: true, data: project });
});

// ---------------------------------------------------------------------------
// DELETE /api/projects/:projectId — delete a project and its tasks
// ---------------------------------------------------------------------------

router.delete("/:projectId", (req, res) => {
  // Delete all tasks belonging to this project first
  const tasks = taskStore.list({ projectId: req.project.id });
  for (const task of tasks) {
    taskStore.delete(task.id);
  }
  projectStore.delete(req.project.id);
  res.status(204).end();
});

// ---------------------------------------------------------------------------
// GET /api/projects/:projectId/tasks — list tasks for a project (nested route)
// ---------------------------------------------------------------------------

router.get("/:projectId/tasks", (req, res) => {
  const tasks = taskStore.list({ projectId: req.project.id });
  res.json({ success: true, data: tasks, meta: { count: tasks.length } });
});

module.exports = router;
