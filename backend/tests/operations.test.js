import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { readConfig } from "../src/config.js";
import { writeStructuredLog } from "../src/middleware/operations.js";
import { createShutdownHandler } from "../src/shutdown.js";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("deployment request behavior", () => {
  it("generates unique server request IDs, including errors and preflight", async () => {
    const app = createApp({ seed: false });
    const responses = [
      await request(app).get("/api/tasks").set("X-Request-Id", "client-secret"),
      await request(app).get("/missing").expect(404),
      await request(app)
        .options("/api/tasks")
        .set("Origin", "http://localhost:5173")
        .set("Access-Control-Request-Method", "PUT")
        .expect(204),
    ];
    for (const response of responses) {
      expect(response.headers["x-request-id"]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    }
    expect(new Set(responses.map((r) => r.headers["x-request-id"])).size).toBe(
      3,
    );
    const corsResponse = await request(app)
      .get("/api/tasks")
      .set("Origin", "http://localhost:5173");
    expect(corsResponse.headers["access-control-expose-headers"]).toBe(
      "X-Request-Id",
    );
  });

  it("sets safe response headers without blocking Swagger scripts", async () => {
    const app = createApp({ seed: false });
    for (const path of ["/api/tasks", "/api/docs/", "/missing"]) {
      const response = await request(app).get(path);
      expect(response.headers).toMatchObject({
        "x-content-type-options": "nosniff",
        "x-frame-options": "DENY",
        "referrer-policy": "no-referrer",
        "permissions-policy": "camera=(), microphone=(), geolocation=()",
        "x-permitted-cross-domain-policies": "none",
      });
      expect(response.headers["content-security-policy"]).toBeUndefined();
      expect(response.headers["x-powered-by"]).toBeUndefined();
    }
    await request(app).get("/api/docs/swagger-ui-bundle.js").expect(200);
    await request(app).get("/api/docs/swagger-ui-init.js").expect(200);
  });

  it("never caches mutable task responses, validation errors, or health", async () => {
    const app = createApp({ seed: false });
    const responses = [
      await request(app).get("/api/tasks"),
      await request(app).get("/api/health"),
      await request(app).get("/api/tasks/missing"),
      await request(app).post("/api/tasks").send({}),
      await request(app)
        .post("/api/tasks")
        .set("Content-Type", "application/json")
        .send("{"),
    ];
    for (const response of responses) {
      expect(response.headers["cache-control"]).toBe("no-store");
      expect(response.headers.etag).toBeUndefined();
    }
    await request(app)
      .get("/api/tasks")
      .set("If-None-Match", '"previous-representation"')
      .expect(200);
  });

  it("logs only normalized request metadata and correlates failed responses", async () => {
    const logger = vi.fn();
    const app = createApp({ seed: false, requestLogging: true, logger });
    const response = await request(app)
      .post("/api/tasks?private=secret-query")
      .set("Authorization", "Bearer secret-token")
      .send({ title: "secret-title", description: "secret-description" })
      .expect(201);
    await request(app)
      .get("/api/tasks/secret-person?token=secret-query")
      .expect(404);
    await request(app).get("/secret-person").expect(404);
    await request(app).get("/api/health").expect(200);
    await request(app).get("/api/openapi.json").expect(200);
    await request(app).get("/api/docs/").expect(200);
    expect(logger.mock.calls[0][0]).toEqual({
      event: "http_request",
      requestId: response.headers["x-request-id"],
      method: "POST",
      path: "/api/tasks",
      status: 201,
      durationMs: expect.any(Number),
    });
    expect(logger.mock.calls.map(([entry]) => entry.path)).toEqual([
      "/api/tasks",
      "/api/tasks/:id",
      "/unmatched",
      "/api/health",
      "/api/openapi.json",
      "/api/docs",
    ]);
    expect(logger.mock.calls[1][0].status).toBe(404);
    expect(logger.mock.calls[0][0].durationMs).toBeGreaterThanOrEqual(0);
    expect(JSON.stringify(logger.mock.calls)).not.toContain("secret");
  });

  it("keeps local requests quiet and logger failures cannot break responses", async () => {
    const logger = vi.fn();
    await request(createApp({ seed: false, logger }))
      .get("/api/health")
      .expect(200);
    expect(logger).not.toHaveBeenCalled();
    const errorOutput = vi.spyOn(console, "error").mockImplementation(() => {});
    await request(
      createApp({
        seed: false,
        requestLogging: true,
        logger: () => {
          throw new Error("private");
        },
      }),
    )
      .get("/api/health")
      .expect(200);
    expect(errorOutput).toHaveBeenCalledWith("Request logger failed.");
  });

  it("writes one JSON line per production log entry", () => {
    const output = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    writeStructuredLog({ event: "http_request", status: 200 });
    expect(output).toHaveBeenCalledWith(
      '{"event":"http_request","status":200}\n',
    );
  });

  it("enables logs only in production and accepts an explicit disable", () => {
    expect(readConfig({ NODE_ENV: "production" }).requestLogging).toBe(true);
    expect(
      readConfig({ NODE_ENV: "production", REQUEST_LOGGING: "false" })
        .requestLogging,
    ).toBe(false);
    expect(
      readConfig({ NODE_ENV: "development", REQUEST_LOGGING: "true" })
        .requestLogging,
    ).toBe(false);
    expect(readConfig({ HOST: "127.0.0.1" }).host).toBe("127.0.0.1");
  });
});

describe("graceful shutdown", () => {
  it("waits for in-flight work, ignores repeat signals, and cancels the deadline", () => {
    vi.useFakeTimers();
    let drained;
    const server = {
      close: vi.fn((done) => {
        drained = done;
      }),
      closeAllConnections: vi.fn(),
    };
    const exit = vi.fn();
    const shutdown = createShutdownHandler({ server, exit });
    shutdown();
    shutdown();
    expect(server.close).toHaveBeenCalledTimes(1);
    expect(exit).not.toHaveBeenCalled();
    drained();
    expect(exit).toHaveBeenCalledExactlyOnceWith(0);
    vi.advanceTimersByTime(20_000);
    expect(server.closeAllConnections).not.toHaveBeenCalled();
  });

  it("bounds draining time and prevents a later success exit", () => {
    vi.useFakeTimers();
    let drained;
    const server = {
      close: vi.fn((done) => {
        drained = done;
      }),
      closeAllConnections: vi.fn(),
    };
    const exit = vi.fn();
    const shutdown = createShutdownHandler({ server, exit, timeoutMs: 100 });
    shutdown();
    vi.advanceTimersByTime(99);
    expect(exit).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(server.closeAllConnections).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledExactlyOnceWith(1);
    drained();
    expect(exit).toHaveBeenCalledOnce();
  });

  it("reports shutdown errors with a failure exit", () => {
    const server = { close: (done) => done(new Error("close failed")) };
    const exit = vi.fn();
    createShutdownHandler({ server, exit })();
    expect(exit).toHaveBeenCalledExactlyOnceWith(1);
  });
});
