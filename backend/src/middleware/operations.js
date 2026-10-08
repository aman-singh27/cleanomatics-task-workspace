import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

export function writeStructuredLog(entry) {
  process.stdout.write(`${JSON.stringify(entry)}\n`);
}

function logPath(path) {
  if (path === "/api/tasks") return path;
  if (path.startsWith("/api/tasks/")) return "/api/tasks/:id";
  if (path === "/api/health" || path === "/api/openapi.json") return path;
  if (path === "/api/docs" || path.startsWith("/api/docs/")) return "/api/docs";
  return "/unmatched";
}

export function createOperationsMiddleware({ requestLogging, logger }) {
  return (req, res, next) => {
    const requestId = randomUUID();
    const startedAt = performance.now();
    req.requestId = requestId;
    res.set({
      "X-Request-Id": requestId,
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "X-Permitted-Cross-Domain-Policies": "none",
    });
    if (
      req.path === "/api/health" ||
      req.path === "/api/tasks" ||
      req.path.startsWith("/api/tasks/")
    ) {
      res.set("Cache-Control", "no-store");
    }
    if (requestLogging) {
      const path = logPath(req.path);
      res.once("finish", () => {
        try {
          logger({
            event: "http_request",
            requestId,
            method: req.method,
            path,
            status: res.statusCode,
            durationMs: Number((performance.now() - startedAt).toFixed(2)),
          });
        } catch {
          // Logging failures must not interrupt API requests or reveal log data.
          console.error("Request logger failed.");
        }
      });
    }
    next();
  };
}
