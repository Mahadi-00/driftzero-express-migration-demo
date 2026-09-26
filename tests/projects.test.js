/**
 * Projects API integration tests.
 */

"use strict";

const request = require("supertest");
const app = require("../src/index");
const projectStore = require("../src/models/projects");
const taskStore    = require("../src/models/tasks");

beforeEach(() => {
  projectStore.reset();
  taskStore.reset();
});

describe("GET /api/projects", () => {
  it("returns 200 with array of projects", async () => {
    const res = await request(app).get("/api/projects");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe("POST /api/projects", () => {
  it("creates a project and returns 201", async () => {
    const res = await request(app)
      .post("/api/projects")
      .send({ name: "New Project", ownerId: "user-001" });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("New Project");
    expect(res.body.data.status).toBe("active");
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/projects")
      .send({ ownerId: "user-001" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when ownerId is missing", async () => {
    const res = await request(app)
      .post("/api/projects")
      .send({ name: "No Owner" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/projects/:projectId", () => {
  it("returns 200 with the project", async () => {
    const res = await request(app).get("/api/projects/proj-001");
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("proj-001");
  });

  it("returns 404 for unknown project", async () => {
    const res = await request(app).get("/api/projects/unknown-proj");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PROJECT_NOT_FOUND");
  });
});

describe("PATCH /api/projects/:projectId", () => {
  it("updates a project", async () => {
    const res = await request(app)
      .patch("/api/projects/proj-001")
      .send({ name: "Renamed Project" });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Renamed Project");
  });

  it("returns 400 for invalid status", async () => {
    const res = await request(app)
      .patch("/api/projects/proj-001")
      .send({ status: "not-a-status" });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/projects/:projectId", () => {
  it("deletes the project and returns 204", async () => {
    const created = await request(app)
      .post("/api/projects")
      .send({ name: "Deletable", ownerId: "user-001" });
    const id = created.body.data.id;

    const del = await request(app).delete(`/api/projects/${id}`);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/api/projects/${id}`);
    expect(get.status).toBe(404);
  });
});

describe("GET /api/projects/:projectId/tasks", () => {
  it("returns tasks for the project", async () => {
    const res = await request(app).get("/api/projects/proj-001/tasks");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.every(t => t.projectId === "proj-001")).toBe(true);
  });

  it("returns 404 for unknown project", async () => {
    const res = await request(app).get("/api/projects/no-such-proj/tasks");
    expect(res.status).toBe(404);
  });
});
