/**
 * Tasks API integration tests.
 *
 * Tests the complete Express 4 tasks API using supertest.
 * No mocks — runs against the real in-memory store.
 */

"use strict";

const request = require("supertest");
const app = require("../src/index");
const taskStore = require("../src/models/tasks");

beforeEach(() => {
  taskStore.reset();
});

describe("GET /api/health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.timestamp).toBe("string");
  });
});

describe("GET /api/tasks", () => {
  it("returns 200 with an array of tasks", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.count).toBe(res.body.data.length);
  });

  it("returns seeded tasks", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("filters by status", async () => {
    const res = await request(app).get("/api/tasks?status=done");
    expect(res.status).toBe(200);
    expect(res.body.data.every(t => t.status === "done")).toBe(true);
  });

  it("returns 400 for invalid status filter", async () => {
    const res = await request(app).get("/api/tasks?status=invalid");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/tasks", () => {
  it("creates a task and returns 201", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "New integration task", priority: "high" });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("New integration task");
    expect(res.body.data.priority).toBe("high");
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.createdAt).toBeDefined();
  });

  it("defaults status to pending", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Default status task" });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("pending");
  });

  it("returns 400 when title is missing", async () => {
    const res = await request(app).post("/api/tasks").send({ priority: "low" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when title is empty string", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "   " });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid priority", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Bad priority task", priority: "ultra" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_PRIORITY");
  });
});

describe("GET /api/tasks/:taskId", () => {
  it("returns 200 with the task", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .send({ title: "Fetch me" });
    const id = created.body.data.id;

    const res = await request(app).get(`/api/tasks/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
    expect(res.body.data.title).toBe("Fetch me");
  });

  it("returns 404 for an unknown task ID", async () => {
    const res = await request(app).get("/api/tasks/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("TASK_NOT_FOUND");
  });
});

describe("PATCH /api/tasks/:taskId", () => {
  it("updates a task and returns 200", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .send({ title: "Original title" });
    const id = created.body.data.id;

    const res = await request(app)
      .patch(`/api/tasks/${id}`)
      .send({ title: "Updated title", status: "in_progress" });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Updated title");
    expect(res.body.data.status).toBe("in_progress");
  });

  it("returns 404 for unknown task", async () => {
    const res = await request(app)
      .patch("/api/tasks/no-such-task")
      .send({ title: "x" });
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid status update", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .send({ title: "Status check" });
    const id = created.body.data.id;

    const res = await request(app)
      .patch(`/api/tasks/${id}`)
      .send({ status: "not-valid" });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/tasks/:taskId", () => {
  it("deletes a task and returns 204", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .send({ title: "To be deleted" });
    const id = created.body.data.id;

    const del = await request(app).delete(`/api/tasks/${id}`);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/api/tasks/${id}`);
    expect(get.status).toBe(404);
  });

  it("returns 404 for unknown task", async () => {
    const res = await request(app).delete("/api/tasks/unknown-id");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/tasks — projectId filter", () => {
  it("returns only tasks for the given projectId", async () => {
    await request(app)
      .post("/api/tasks")
      .send({ title: "Project task", projectId: "proj-test-123" });

    const res = await request(app).get("/api/tasks?projectId=proj-test-123");
    expect(res.status).toBe(200);
    expect(res.body.data.every(t => t.projectId === "proj-test-123")).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
