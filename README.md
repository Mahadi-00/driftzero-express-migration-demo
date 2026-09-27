# driftzero-express-migration-demo

**P33 DriftZero Migration Fixture**

This is the migration target repository for the DriftZero demo. DriftZero will
migrate this application from Express 4 to Express 5 as part of its P34
end-to-end demonstration.

---

## What This Application Does

A realistic task-management REST API with three resource types:

- **Tasks** — `POST /api/tasks`, `GET /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`
- **Projects** — `POST /api/projects`, `GET /api/projects`, `PATCH /api/projects/:id`, `DELETE /api/projects/:id`
- **Users** — `POST /api/users`, `GET /api/users`, `PATCH /api/users/:id`, `DELETE /api/users/:id`

Data is stored in-memory. There is no database dependency — the application is
intentionally self-contained.

---

## Current Express Version

| Field | Value |
|-------|-------|
| Express | **4.22.3** (`^4.21.2`) |
| Node.js | ≥ 18.0.0 (tested on 22.22.1) |
| Package manager | npm |

## Intended Target Version

| Field | Value |
|-------|-------|
| Express | **5.x** |

---

## How to Install

```bash
npm install
```

## How to Run Tests

```bash
npm test
```

All 43 tests across 3 suites should pass.

## How to Build

This application does not have a build step (pure JavaScript, no TypeScript compilation).

## How to Start

```bash
# Default port 3001
node src/index.js

# Custom port
PORT=4001 node src/index.js
```

After startup, verify:

```bash
curl http://localhost:3001/api/health
# {"status":"ok","version":"1.0.0","timestamp":"..."}
```

---

## Known Migration Surfaces

These are the Express 4 → Express 5 patterns present in the codebase that
DriftZero will detect and migrate:

### MS-001: `express-async-errors` required
**File:** `src/index.js`

Express 4 does not propagate rejected Promises from async route handlers to the
error handler natively. The `express-async-errors` package patches Express to
do this. Express 5 builds this in — the package and its `require()` can be removed.

### MS-002: `body-parser` as a separate dependency
**File:** `src/index.js`

Express 4 requires `body-parser` as a separate npm package. Express 5 ships
`express.json()` and `express.urlencoded()` as built-ins — `body-parser` can be
removed from `dependencies` and its imports replaced.

### MS-003: Async route handlers that `throw` (relying on the patch)
**Files:** `src/routes/tasks.js`, `src/routes/projects.js`, `src/routes/users.js`

All async route handlers use `throw new AppError(...)` directly, relying on
`express-async-errors` to catch them. In Express 5 this works natively.
The `throw` pattern remains valid in Express 5 — no handler code changes needed,
but the dependency on `express-async-errors` is removed.

### MS-004: `res.sendfile()` (lowercase) removed in Express 5
**File:** `src/routes/users.js` (`/api/users/:userId/avatar`)

`res.sendfile()` (lowercase `f`) was deprecated in Express 4 and **removed** in
Express 5. Must be replaced with `res.sendFile()` (capital `F`). The avatar
endpoint currently uses `res.sendFile()` (already correct), but the migration
comment documents the removal for completeness.

### MS-005: `process.on('unhandledRejection')` Express 4 compensation
**File:** `src/index.js`

Express 4 (without the async-errors patch) does not catch unhandled Promise
rejections in route handlers. The `unhandledRejection` listener was added as a
safety net. Express 5 makes this unnecessary — the listener can be removed.

### MS-006: `path.join(__dirname, ...)` for `res.sendFile()`
**File:** `src/routes/users.js`

Express 4 requires an absolute path for `res.sendFile()`. The `__dirname`-based
construction is the standard pattern. This continues to work in Express 5.

---

## Why This Repository Exists

DriftZero is a generic automated migration system. It needs a real, non-trivial
target repository to demonstrate the full migration lifecycle:

```
Change Analysis → Impact Analysis → Risk Assessment → Migration Preview →
Migration Planning → Code Migration → Test Generation → Validation →
Recovery → Change Verification → Security Review → Safety Gate →
Diff Intelligence → Confidence → Git Commit → Pull Request
```

This repository provides a **known-good Express 4 baseline** with enough real
migration surfaces to exercise every stage of that pipeline.

The repository is intentionally **not** part of DriftZero's own source code.
DriftZero migrates *this* repository — it does not migrate itself.

---

## P33 Baseline Record

| Field | Value |
|-------|-------|
| Baseline commit | `eaaaecc536b4f58688ae547d3d5b74051277b7cc` |
| Branch | `main` |
| Tests | 43 passed / 0 failed |
| Startup | OK (`/api/health` returns 200) |
| Clean git state | Yes |
| Express installed version | 4.22.3 |

---

## Architecture

```
driftzero-express-migration-demo/
├── src/
│   ├── index.js               # Application bootstrap (Express 4 migration surfaces)
│   ├── models/
│   │   ├── tasks.js           # In-memory task store
│   │   ├── projects.js        # In-memory project store
│   │   └── users.js           # In-memory user store
│   ├── routes/
│   │   ├── tasks.js           # Task CRUD routes
│   │   ├── projects.js        # Project CRUD + nested tasks
│   │   └── users.js           # User CRUD + avatar endpoint
│   └── middleware/
│       ├── errorHandler.js    # Centralized error handler + AppError class
│       └── notFound.js        # 404 handler
├── tests/
│   ├── tasks.test.js          # 25 task API tests
│   ├── projects.test.js       # 12 project API tests
│   └── users.test.js          # 14 user API tests (+ 2 error handling tests)
├── package.json
├── package-lock.json
└── .env.example
```
