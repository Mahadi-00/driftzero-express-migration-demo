/**
 * In-memory user store.
 */

"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {Map<string, User>} */
const store = new Map();

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} role   - "admin" | "member" | "viewer"
 * @property {string} createdAt
 * @property {string} updatedAt
 */

function seed() {
  const users = [
    { id: "user-001", name: "Alice Chen",   email: "alice@example.com",  role: "admin"  },
    { id: "user-002", name: "Bob Tanaka",   email: "bob@example.com",    role: "member" },
    { id: "user-003", name: "Carol Smith",  email: "carol@example.com",  role: "member" },
  ];

  for (const u of users) {
    const now = new Date().toISOString();
    store.set(u.id, { ...u, createdAt: now, updatedAt: now });
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
  findByEmail(email) {
    return Array.from(store.values()).find(u => u.email === email);
  },
  create(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const user = { id, role: "member", ...data, createdAt: now, updatedAt: now };
    store.set(id, user);
    return user;
  },
  update(id, updates) {
    const existing = store.get(id);
    if (!existing) return null;
    // Never overwrite email or id
    const { id: _id, email: _email, ...safe } = updates;
    void _id; void _email;
    const updated = { ...existing, ...safe, id, updatedAt: new Date().toISOString() };
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
