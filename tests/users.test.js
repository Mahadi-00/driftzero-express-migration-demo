/**
 * Users API integration tests.
 */

"use strict";

const request = require("supertest");
const app = require("../src/index");
const userStore = require("../src/models/users");

beforeEach(() => {
  userStore.reset();
});

describe("GET /api/users", () => {
  it("returns 200 with array of users", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("does not expose sensitive fields in list", async () => {
    const res = await request(app).get("/api/users");
    for (const user of res.body.data) {
      expect(user).not.toHaveProperty("password");
      expect(user).not.toHaveProperty("updatedAt"); // omitted in list
    }
  });
});

describe("POST /api/users", () => {
  it("creates a user and returns 201", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ name: "Dave Jones", email: "dave@example.com", role: "member" });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Dave Jones");
    expect(res.body.data.email).toBe("dave@example.com");
    expect(res.body.data.role).toBe("member");
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ email: "no-name@example.com" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for invalid email", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ name: "Test", email: "not-an-email" });
    expect(res.status).toBe(400);
  });

  it("returns 409 for duplicate email", async () => {
    await request(app)
      .post("/api/users")
      .send({ name: "First", email: "dup@example.com" });
    const res = await request(app)
      .post("/api/users")
      .send({ name: "Second", email: "dup@example.com" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("DUPLICATE_EMAIL");
  });

  it("returns 400 for invalid role", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ name: "Role Test", email: "role@example.com", role: "superadmin" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_ROLE");
  });
});

describe("GET /api/users/:userId", () => {
  it("returns 200 with user data", async () => {
    const res = await request(app).get("/api/users/user-001");
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("user-001");
  });

  it("returns 404 for unknown user", async () => {
    const res = await request(app).get("/api/users/no-such-user");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("USER_NOT_FOUND");
  });
});

describe("PATCH /api/users/:userId", () => {
  it("updates user name", async () => {
    const res = await request(app)
      .patch("/api/users/user-001")
      .send({ name: "Alice Updated" });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Alice Updated");
  });

  it("returns 404 for unknown user", async () => {
    const res = await request(app)
      .patch("/api/users/no-user")
      .send({ name: "x" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/users/:userId", () => {
  it("deletes user and returns 204", async () => {
    const created = await request(app)
      .post("/api/users")
      .send({ name: "Temp User", email: "temp@example.com" });
    const id = created.body.data.id;

    const del = await request(app).delete(`/api/users/${id}`);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/api/users/${id}`);
    expect(get.status).toBe(404);
  });
});

describe("Error handling", () => {
  it("returns 404 for undefined routes", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns JSON errors not HTML", async () => {
    const res = await request(app).get("/not-a-route");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body.success).toBe(false);
  });
});
