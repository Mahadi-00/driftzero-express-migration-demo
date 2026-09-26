/**
 * Users router — Express 4.
 *
 * DriftZero P33 migration surfaces:
 *
 * 1. express-async-errors patch required — async handlers throw without next(err).
 *    Express 5 propagates rejected Promises natively.
 *
 * 2. res.sendfile() (lowercase) is deprecated in Express 4 and REMOVED in Express 5.
 *    Must be replaced with res.sendFile() (capital F, absolute path required).
 *    See the /avatar endpoint below.
 */

"use strict";

const path   = require("path");
const router = require("express").Router();
const userStore = require("../models/users");
const { AppError } = require("../middleware/errorHandler");

// router.param() — correct Express 4 signature: (req, res, next, value)
router.param("userId", (req, res, next, id) => {
  const user = userStore.findById(id);
  if (!user) {
    return next(new AppError("User not found", 404, "USER_NOT_FOUND"));
  }
  req.user = user;
  next();
});

// ---------------------------------------------------------------------------
// GET /api/users — list users
// ---------------------------------------------------------------------------

router.get("/", async (_req, res) => {
  const users = userStore.list();
  // Omit sensitive fields before returning
  const safe = users.map(({ id, name, email, role, createdAt }) => ({
    id, name, email, role, createdAt,
  }));
  res.json({ success: true, data: safe, meta: { count: safe.length } });
});

// ---------------------------------------------------------------------------
// POST /api/users — create a user
// ---------------------------------------------------------------------------

router.post("/", async (req, res) => {
  const { name, email, role } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    throw new AppError("name is required", 400, "VALIDATION_ERROR");
  }
  if (!email || typeof email !== "string") {
    throw new AppError("email is required", 400, "VALIDATION_ERROR");
  }
  if (!email.includes("@")) {
    throw new AppError("email must be a valid address", 400, "VALIDATION_ERROR");
  }

  const existing = userStore.findByEmail(email);
  if (existing) {
    throw new AppError("A user with this email already exists", 409, "DUPLICATE_EMAIL");
  }

  const validRoles = ["admin", "member", "viewer"];
  if (role && !validRoles.includes(role)) {
    throw new AppError(
      `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      400,
      "INVALID_ROLE"
    );
  }

  const user = userStore.create({ name: name.trim(), email, role });
  const { id, createdAt, updatedAt } = user;
  res.status(201).json({
    success: true,
    data: { id, name: user.name, email: user.email, role: user.role, createdAt, updatedAt },
  });
});

// ---------------------------------------------------------------------------
// GET /api/users/:userId — get a single user
// ---------------------------------------------------------------------------

router.get("/:userId", (req, res) => {
  const { id, name, email, role, createdAt } = req.user;
  res.json({ success: true, data: { id, name, email, role, createdAt } });
});

// ---------------------------------------------------------------------------
// PATCH /api/users/:userId — update a user
// ---------------------------------------------------------------------------

router.patch("/:userId", async (req, res) => {
  const allowed = ["name", "role"];
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

  const user = userStore.update(req.user.id, updates);
  const { id, name, email, role, updatedAt } = user;
  res.json({ success: true, data: { id, name, email, role, updatedAt } });
});

// ---------------------------------------------------------------------------
// DELETE /api/users/:userId — delete a user
// ---------------------------------------------------------------------------

router.delete("/:userId", (req, res) => {
  userStore.delete(req.user.id);
  res.status(204).end();
});

// ---------------------------------------------------------------------------
// GET /api/users/:userId/avatar — serve user avatar
//
// MIGRATION SURFACE 3: res.sendfile() (Express 4 lowercase, deprecated)
// Express 5 removes res.sendfile() — requires res.sendFile() with absolute path.
// ---------------------------------------------------------------------------

router.get("/:userId/avatar", (req, res, next) => {
  // In a real app this would serve the user's avatar image.
  // We use the default placeholder for the demo.
  const avatarPath = path.join(__dirname, "../assets/default-avatar.png");

  // MIGRATION SURFACE: res.sendfile() is deprecated in Express 4 and
  // REMOVED in Express 5. Must be replaced with res.sendFile().
  // res.sendfile(avatarPath) would be the Express 4 call.
  // For baseline correctness we use res.sendFile() (Express 4 also supports it).
  res.sendFile(avatarPath, (err) => {
    if (err) {
      // Fall back to a JSON response if the file does not exist
      res.json({
        success: true,
        data: { userId: req.user.id, avatarUrl: null, message: "No avatar set" },
      });
    }
  });
});

module.exports = router;
