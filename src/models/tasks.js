/**
 * In-memory task store.
 *
 * Represents a minimal data layer. In a real application this would be a
 * database. For the P33 migration fixture this keeps the demo self-contained.
 */

"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {Map<string, Task>} */
const store = new Map();

/**
 * @typedef {Object} Task
 * @property {string}  id
 * @property {string}  title
 * @property {string}  [description]
 * @property {string}  status       - "pending" | "in_progress" | "done" | "cancelled"
 * @property {string}  priority     - "low" | "medium" | "high"
 * @property {string}  [projectId]
 * @property {string}  [assigneeId]
 * @property {string}  [dueDate]    - ISO 8601 date string
 * @property {string}  createdAt    - ISO 8601 datetime
 * @property {string}  updatedAt    - ISO 8601 datetime
 */

/**
 * Seed some initial tasks so the API is non-empty on startup.
 */
function seed() {
  const tasks = [
    {
      title: "Set up CI pipeline",
      description: "Configure GitHub Actions for lint, test, and build.",
      status: "done",
      priority: "high",
      projectId: "proj-001",
      assigneeId: "user-001",
    },
    {
      title: "Migrate to Express 5",
      description:
        "Update the application to use Express 5 APIs. Remove express-async-errors, " +
        "update body-parser imports, fix router.param() callbacks.",
      status: "pending",
      priority: "high",
      projectId: "proj-001",
    },
    {
      title: "Add rate limiting",
      description: "Apply per-IP rate limiting to mutating endpoints.",
      status: "in_progress",
      priority: "medium",
      projectId: "proj-001",
      assigneeId: "user-002",
    },
    {
      title: "Write integration tests for tasks API",
      description: "Cover create, list, update, delete, and error cases.",
      status: "done",
      priority: "medium",
      projectId: "proj-001",
      assigneeId: "user-001",
    },
    {
      title: "Add OpenAPI documentation",
      description: "Document all endpoints using the OpenAPI 3.1 spec.",
      status: "pending",
      priority: "low",
    },
  ];

  for (const t of tasks) {
    const id = uuidv4();
    const now = new Date().toISOString();
    store.set(id, { id, ...t, createdAt: now, updatedAt: now });
  }
}

seed();

module.exports = {
  /**
   * List all tasks (optionally filtered by projectId or status).
   * @param {{ projectId?: string, status?: string }} [filters]
   * @returns {Task[]}
   */
  list(filters = {}) {
    let tasks = Array.from(store.values());
    if (filters.projectId) tasks = tasks.filter(t => t.projectId === filters.projectId);
    if (filters.status)    tasks = tasks.filter(t => t.status    === filters.status);
    return tasks.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  /**
   * Find a task by ID.
   * @param {string} id
   * @returns {Task | undefined}
   */
  findById(id) {
    return store.get(id);
  },

  /**
   * Create a new task.
   * @param {Omit<Task, "id" | "createdAt" | "updatedAt">} data
   * @returns {Task}
   */
  create(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    // Filter out undefined values so defaults are not overwritten
    const filtered = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );
    const task = { id, status: "pending", priority: "medium", ...filtered, createdAt: now, updatedAt: now };
    store.set(id, task);
    return task;
  },

  /**
   * Update an existing task (partial update).
   * @param {string} id
   * @param {Partial<Task>} updates
   * @returns {Task | null}
   */
  update(id, updates) {
    const existing = store.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    store.set(id, updated);
    return updated;
  },

  /**
   * Delete a task by ID.
   * @param {string} id
   * @returns {boolean}
   */
  delete(id) {
    return store.delete(id);
  },

  /**
   * Reset the store (used in tests).
   */
  reset() {
    store.clear();
    seed();
  },
};
