/**
 * In-memory project store.
 */

"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {Map<string, Project>} */
const store = new Map();

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {string} status  - "active" | "archived" | "completed"
 * @property {string} ownerId
 * @property {string} createdAt
 * @property {string} updatedAt
 */

function seed() {
  const projects = [
    {
      name: "Platform Modernisation",
      description: "Upgrade the API to use current best practices and dependencies.",
      status: "active",
      ownerId: "user-001",
    },
    {
      name: "Developer Experience",
      description: "Improve tooling, documentation, and onboarding.",
      status: "active",
      ownerId: "user-002",
    },
  ];

  for (const p of projects) {
    const id = p.name === "Platform Modernisation" ? "proj-001" : "proj-002";
    const now = new Date().toISOString();
    store.set(id, { id, ...p, createdAt: now, updatedAt: now });
  }
}

seed();

module.exports = {
  list() {
    return Array.from(store.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  findById(id) {
    return store.get(id);
  },
  create(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const project = { id, status: "active", ...data, createdAt: now, updatedAt: now };
    store.set(id, project);
    return project;
  },
  update(id, updates) {
    const existing = store.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    store.set(id, updated);
    return updated;
  },
  delete(id) {
    return store.delete(id);
  },
  reset() {
    store.clear();
    seed();
  },
};
