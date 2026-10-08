const taskProperties = {
  title: {
    type: "string",
    minLength: 1,
    maxLength: 120,
    description: "Required; trimmed; whitespace-only values rejected.",
    example: "Inspect linen quality",
  },
  description: {
    type: "string",
    minLength: 1,
    maxLength: 2000,
    description: "Required; trimmed; whitespace-only values rejected.",
    example: "Review the hotel batch before dispatch.",
  },
  status: {
    type: "string",
    enum: ["pending", "in_progress", "completed"],
    default: "pending",
  },
  priority: {
    type: "string",
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  dueDate: {
    type: "string",
    format: "date",
    nullable: true,
    default: null,
    pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    description:
      "Real calendar date, YYYY-MM-DD; year 0000 rejected. Past dates allowed.",
    example: "2026-10-09",
  },
};
const json = (schema) => ({ "application/json": { schema } });
const task = { $ref: "#/components/schemas/Task" };
const input = { $ref: "#/components/schemas/TaskInput" };
const response = (description, schema) => ({
  description,
  content: json(schema),
});
const badRequest = { $ref: "#/components/responses/BadRequest" };
const notFound = { $ref: "#/components/responses/NotFound" };
const tooLarge = { $ref: "#/components/responses/TooLarge" };
const serverError = { $ref: "#/components/responses/ServerError" };
const requestBody = { required: true, content: json(input) };

export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "Cleanomatics Task Workspace API",
    version: "1.0.0",
    description:
      "Assignment demonstration. Tasks live only in this process memory and reset on restart. No authentication or database. Search, filters, sorting and pagination run in the frontend.",
  },
  servers: [{ url: "/", description: "Current API host" }],
  tags: [{ name: "Tasks" }, { name: "System" }],
  paths: {
    "/api/tasks": {
      get: {
        tags: ["Tasks"],
        operationId: "listTasks",
        summary: "List all tasks",
        responses: {
          200: response("Array of tasks in insertion order.", {
            type: "array",
            items: task,
          }),
          500: serverError,
        },
      },
      post: {
        tags: ["Tasks"],
        operationId: "createTask",
        summary: "Create a task",
        description:
          "Server generates UUID and timestamps. Optional fields default to pending, medium and null. Unknown fields rejected. Maximum JSON body: 100 KiB.",
        requestBody,
        responses: {
          201: response("Created task.", task),
          400: badRequest,
          413: tooLarge,
          500: serverError,
        },
      },
    },
    "/api/tasks/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "Task identifier returned by the API.",
          schema: { type: "string" },
        },
      ],
      get: {
        tags: ["Tasks"],
        operationId: "getTask",
        summary: "Read task details",
        responses: {
          200: response("Task details.", task),
          404: notFound,
          500: serverError,
        },
      },
      put: {
        tags: ["Tasks"],
        operationId: "replaceTask",
        summary: "Replace editable task fields",
        description:
          "Requires title and description. Omitted status, priority and dueDate reset to pending, medium and null. Preserve id and createdAt; generate updatedAt. Invalid body is rejected before checking task existence. Maximum JSON body: 100 KiB.",
        requestBody,
        responses: {
          200: response("Updated task.", task),
          400: badRequest,
          404: notFound,
          413: tooLarge,
          500: serverError,
        },
      },
      delete: {
        tags: ["Tasks"],
        operationId: "deleteTask",
        summary: "Delete a task",
        responses: {
          200: response("Deletion confirmation.", {
            type: "object",
            required: ["message", "id"],
            properties: {
              message: {
                type: "string",
                example: "Task deleted successfully.",
              },
              id: { type: "string", format: "uuid" },
            },
          }),
          404: notFound,
          500: serverError,
        },
      },
    },
    "/api/health": {
      get: {
        tags: ["System"],
        operationId: "health",
        summary: "Check API availability",
        responses: {
          200: response("API is available.", {
            type: "object",
            required: ["status", "storage"],
            properties: {
              status: { type: "string", enum: ["ok"] },
              storage: { type: "string", enum: ["memory"] },
            },
          }),
        },
      },
    },
  },
  components: {
    schemas: {
      TaskInput: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description"],
        properties: taskProperties,
      },
      Task: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "title",
          "description",
          "status",
          "priority",
          "dueDate",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          ...taskProperties,
          id: { type: "string", format: "uuid", readOnly: true },
          createdAt: { type: "string", format: "date-time", readOnly: true },
          updatedAt: { type: "string", format: "date-time", readOnly: true },
        },
      },
      Error: {
        type: "object",
        required: ["message"],
        properties: {
          message: { type: "string" },
          errors: {
            type: "object",
            additionalProperties: { type: "string" },
            description: "Optional per-field validation errors.",
          },
        },
      },
    },
    responses: {
      BadRequest: {
        ...response(
          "Invalid JSON, non-object body, missing required fields, unknown fields, or invalid task field values.",
          { $ref: "#/components/schemas/Error" },
        ),
      },
      NotFound: {
        ...response("Task or route not found.", {
          $ref: "#/components/schemas/Error",
        }),
      },
      TooLarge: {
        ...response("JSON request exceeds 100 KiB.", {
          $ref: "#/components/schemas/Error",
        }),
      },
      ServerError: {
        ...response("Unexpected error; internal details are never exposed.", {
          $ref: "#/components/schemas/Error",
        }),
      },
    },
  },
};
