import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { readFileSync } from "node:fs";
import { createApp } from "../src/app.js";
import { createTaskService } from "../src/services/task-service.js";
import { readConfig } from "../src/config.js";

const valid = {
  title: "Inspect quality",
  description: "Review the linen batch before dispatch.",
};
let app;
beforeEach(() => {
  app = createApp({ seed: false });
});

describe("task lifecycle", () => {
  it("creates, reads, replaces and deletes an isolated task", async () => {
    expect((await request(app).get("/api/tasks")).body).toEqual([]);
    const created = await request(app)
      .post("/api/tasks")
      .send({ title: "  Inspect quality  ", description: " Review linen. " })
      .expect(201);
    expect(created.body).toMatchObject({
      title: "Inspect quality",
      description: "Review linen.",
      status: "pending",
      priority: "medium",
      dueDate: null,
    });
    expect(created.body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(Date.parse(created.body.createdAt)).not.toBeNaN();
    expect(created.body.updatedAt).toBe(created.body.createdAt);
    const id = created.body.id;
    expect(
      (await request(app).get(`/api/tasks/${id}`).expect(200)).body,
    ).toEqual(created.body);
    expect((await request(app).get("/api/tasks").expect(200)).body).toEqual([
      created.body,
    ]);
    const updated = await request(app)
      .put(`/api/tasks/${id}`)
      .send({
        ...valid,
        status: "completed",
        priority: "high",
        dueDate: "2028-02-29",
      })
      .expect(200);
    expect(updated.body).toMatchObject({
      ...valid,
      id,
      status: "completed",
      priority: "high",
      dueDate: "2028-02-29",
      createdAt: created.body.createdAt,
    });
    expect(Date.parse(updated.body.updatedAt)).toBeGreaterThanOrEqual(
      Date.parse(created.body.updatedAt),
    );
    const replaced = await request(app)
      .put(`/api/tasks/${id}`)
      .send(valid)
      .expect(200);
    expect(replaced.body).toMatchObject({
      status: "pending",
      priority: "medium",
      dueDate: null,
    });
    expect(
      (await request(app).delete(`/api/tasks/${id}`).expect(200)).body,
    ).toEqual({ message: "Task deleted successfully.", id });
    await request(app).get(`/api/tasks/${id}`).expect(404);
    await request(app).delete(`/api/tasks/${id}`).expect(404);
    expect((await request(app).get("/api/tasks")).body).toEqual([]);
  });

  it.each(["get", "put", "delete"])(
    "returns JSON 404 for missing task with %s",
    async (method) => {
      const req = request(app)[method]("/api/tasks/missing");
      const response = await (method === "put" ? req.send(valid) : req).expect(
        404,
      );
      expect(response.body).toEqual({ message: "Task not found." });
    },
  );

  it("does not share state between app instances", async () => {
    await request(app).post("/api/tasks").send(valid).expect(201);
    expect(
      (await request(createApp({ seed: false })).get("/api/tasks")).body,
    ).toEqual([]);
  });

  it("seeds twelve realistic tasks with valid varied metadata", async () => {
    const tasks = (await request(createApp()).get("/api/tasks")).body;
    expect(tasks).toHaveLength(12);
    expect(new Set(tasks.map((t) => t.id)).size).toBe(12);
    expect(new Set(tasks.map((t) => t.status)).size).toBe(3);
    expect(new Set(tasks.map((t) => t.priority)).size).toBe(3);
    expect(tasks.some((t) => t.dueDate === null)).toBe(true);
    expect(
      tasks.every(
        (t) =>
          t.title && t.description && !Number.isNaN(Date.parse(t.createdAt)),
      ),
    ).toBe(true);
  });
});

describe("validation", () => {
  const invalid = [
    [{}, "title"],
    [{ title: " ", description: "x" }, "title"],
    [{ title: 1, description: "x" }, "title"],
    [{ title: "x", description: "" }, "description"],
    [{ title: "x", description: null }, "description"],
    [{ ...valid, title: "x".repeat(121) }, "title"],
    [{ ...valid, description: "x".repeat(2001) }, "description"],
    [{ ...valid, status: "done" }, "status"],
    [{ ...valid, status: null }, "status"],
    [{ ...valid, priority: "urgent" }, "priority"],
    [{ ...valid, priority: 3 }, "priority"],
    [{ ...valid, dueDate: "2026-02-29" }, "dueDate"],
    [{ ...valid, dueDate: "2026-04-31" }, "dueDate"],
    [{ ...valid, dueDate: "2026-13-01" }, "dueDate"],
    [{ ...valid, dueDate: "2026-01-00" }, "dueDate"],
    [{ ...valid, dueDate: "2026-1-2" }, "dueDate"],
    [{ ...valid, dueDate: 1 }, "dueDate"],
    [{ ...valid, dueDate: "0000-01-01" }, "dueDate"],
    [{ ...valid, id: "forged" }, "id"],
    [{ ...valid, createdAt: "now" }, "createdAt"],
    [{ ...valid, unknown: true }, "unknown"],
  ];
  it.each(invalid)("rejects invalid payload %#", async (payload, field) => {
    const response = await request(app)
      .post("/api/tasks")
      .send(payload)
      .expect(400);
    expect(response.body.message).toBe("Please correct the task fields.");
    expect(response.body.errors[field]).toBeTruthy();
    expect((await request(app).get("/api/tasks")).body).toEqual([]);
  });
  it.each(["[]", "null", "42", '"text"'])(
    "rejects non-object JSON %s",
    async (body) => {
      await request(app)
        .post("/api/tasks")
        .set("Content-Type", "application/json")
        .send(body)
        .expect(400);
    },
  );
  it("rejects invalid PUT without altering the stored task", async () => {
    const task = (await request(app).post("/api/tasks").send(valid)).body;
    await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ ...valid, status: "done" })
      .expect(400);
    expect((await request(app).get(`/api/tasks/${task.id}`)).body).toEqual(
      task,
    );
  });
  it("accepts max lengths, valid historical date, explicit null and all enum values", async () => {
    await request(app)
      .post("/api/tasks")
      .send({
        title: "x".repeat(120),
        description: "x".repeat(2000),
        status: "in_progress",
        priority: "low",
        dueDate: "1900-01-01",
      })
      .expect(201);
    const response = await request(app)
      .post("/api/tasks")
      .send({ ...valid, dueDate: null })
      .expect(201);
    expect(response.body.dueDate).toBeNull();
  });
  it("rejects malformed JSON with a safe error", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .set("Content-Type", "application/json")
      .send('{"title":')
      .expect(400);
    expect(response.body).toEqual({
      message: "Request body must contain valid JSON.",
    });
  });
  it("rejects oversized payloads", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .send({ ...valid, description: "x".repeat(110000) })
      .expect(413);
    expect(response.body.message).toBe("Request body is too large.");
  });
  it("handles a missing body", async () => {
    await request(app).post("/api/tasks").expect(400);
  });
  it("rejects prototype-shaped unknown fields without changing the error envelope", async () => {
    const body =
      JSON.stringify(valid).slice(0, -1) +
      ',"__proto__":"forged","constructor":"forged"}';
    const response = await request(app)
      .post("/api/tasks")
      .set("Content-Type", "application/json")
      .send(body)
      .expect(400);
    expect(Object.keys(response.body.errors)).toEqual([
      "__proto__",
      "constructor",
    ]);
  });
});

describe("HTTP infrastructure", () => {
  it("exposes health and consistent route errors", async () => {
    expect((await request(app).get("/api/health").expect(200)).body).toEqual({
      status: "ok",
      storage: "memory",
    });
    expect((await request(app).get("/unknown").expect(404)).body).toEqual({
      message: "Route not found.",
    });
    expect(
      (await request(app).get("/api/health")).headers["x-powered-by"],
    ).toBeUndefined();
  });
  it("provides allowed origins and valid preflight, with no permission for unrelated origins", async () => {
    for (const origin of ["http://localhost:5173", "http://127.0.0.1:5173"]) {
      const response = await request(app)
        .options("/api/tasks")
        .set("Origin", origin)
        .set("Access-Control-Request-Method", "PUT")
        .expect(204);
      expect(response.headers["access-control-allow-origin"]).toBe(origin);
      expect(response.headers["access-control-allow-methods"]).toContain("PUT");
    }
    const unrelated = await request(app)
      .get("/api/tasks")
      .set("Origin", "https://unrelated.example")
      .expect(200);
    expect(unrelated.headers["access-control-allow-origin"]).toBeUndefined();
    const custom = createApp({
      seed: false,
      origins: ["https://workspace.example"],
    });
    expect(
      (
        await request(custom)
          .get("/api/tasks")
          .set("Origin", "https://workspace.example")
      ).headers["access-control-allow-origin"],
    ).toBe("https://workspace.example");
  });
  it("serves usable Swagger UI and complete machine-readable contract", async () => {
    await request(app)
      .get("/api/docs/")
      .expect(200)
      .expect("Content-Type", /html/);
    const spec = (await request(app).get("/api/openapi.json").expect(200)).body;
    expect(spec.openapi).toBe("3.0.3");
    expect(spec.paths["/api/tasks"].post.responses["201"]).toBeDefined();
    expect(spec.paths["/api/tasks"].post.responses["400"]).toBeDefined();
    expect(spec.paths["/api/tasks/{id}"].put.responses["404"]).toBeDefined();
    expect(spec.components.schemas.Task.required).toContain("updatedAt");
    expect(spec).toEqual(
      JSON.parse(
        readFileSync(new URL("../openapi.json", import.meta.url), "utf8"),
      ),
    );
  });
  it("hides unexpected error details", async () => {
    const broken = createApp({
      seed: false,
      service: {
        list: vi.fn(() => {
          throw new Error("private stack");
        }),
      },
    });
    expect((await request(broken).get("/api/tasks").expect(500)).body).toEqual({
      message: "An unexpected server error occurred.",
    });
  });
});

describe("service and config", () => {
  it("returns detached records so callers cannot mutate memory", () => {
    const service = createTaskService();
    const task = service.create(valid);
    task.title = "changed";
    service.list()[0].title = "also changed";
    service.get(task.id).description = "changed";
    expect(service.get(task.id)).toMatchObject(valid);
  });
  it("defaults local config and reads explicit overrides", () => {
    expect(readConfig({})).toEqual({
      port: 4000,
      origins: ["http://localhost:5173", "http://127.0.0.1:5173"],
      seed: true,
    });
    expect(
      readConfig({
        PORT: "5000",
        CORS_ORIGINS: " https://a.example, https://b.example ",
        SEED_DEMO_DATA: "false",
      }),
    ).toEqual({
      port: 5000,
      origins: ["https://a.example", "https://b.example"],
      seed: false,
    });
  });
  it.each(["0", "65536", "nope", "4000.5"])(
    "rejects invalid port %s",
    (port) => {
      expect(() => readConfig({ PORT: port })).toThrow(
        "PORT must be an integer between 1 and 65535.",
      );
    },
  );
});
