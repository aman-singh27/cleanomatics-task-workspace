import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { DEFAULT_ORIGINS } from "./config.js";
import { createTaskService } from "./services/task-service.js";
import { createDemoTasks } from "./services/demo-tasks.js";
import { createTaskRouter } from "./routes/task-routes.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { openapi } from "./openapi.js";
import {
  createOperationsMiddleware,
  writeStructuredLog,
} from "./middleware/operations.js";

export function createApp({
  seed = true,
  origins = DEFAULT_ORIGINS,
  service,
  requestLogging = false,
  logger = writeStructuredLog,
} = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.disable("etag");
  app.use(createOperationsMiddleware({ requestLogging, logger }));
  app.use(
    cors({
      origin: (origin, callback) =>
        callback(null, !origin || origins.includes(origin)),
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      exposedHeaders: ["X-Request-Id"],
    }),
  );
  app.use(express.json({ limit: "100kb", strict: false }));
  app.get("/api/health", (_req, res) =>
    res.json({ status: "ok", storage: "memory" }),
  );
  app.get("/api/openapi.json", (_req, res) => res.json(openapi));
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openapi, { customSiteTitle: "Cleanomatics · Task API" }),
  );
  app.use(
    "/api/tasks",
    createTaskRouter(
      service ?? createTaskService(seed ? createDemoTasks() : []),
    ),
  );
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
