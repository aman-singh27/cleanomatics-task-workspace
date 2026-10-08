import { priorities, statuses, type Task, type TaskInput } from "../lib/tasks";
export class ApiError extends Error {
  errors?: Record<string, string>;
  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    this.errors = errors;
  }
}
const base = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const invalidResponse =
  "The task server returned an invalid response. Please try again.";
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function isDate(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value.startsWith("0000-")
  )
    return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
function isTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) &&
    isDate(value.slice(0, 10)) &&
    !Number.isNaN(Date.parse(value))
  );
}
function isTask(value: unknown): value is Task {
  return (
    isRecord(value) &&
    isText(value.id) &&
    isText(value.title) &&
    isText(value.description) &&
    statuses.some((status) => status === value.status) &&
    priorities.some((priority) => priority === value.priority) &&
    (value.dueDate === null || isDate(value.dueDate)) &&
    isTimestamp(value.createdAt) &&
    isTimestamp(value.updatedAt)
  );
}
function readErrors(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined;
  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] => isText(entry[1]),
  );
  return entries.length ? Object.fromEntries(entries) : undefined;
}
async function request<T>(
  path: string,
  validate: (value: unknown) => value is T,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(
      "Unable to reach the task server. Check your connection and try again.",
    );
  }
  const data: unknown = await response.json().catch(() => undefined);
  if (!response.ok)
    throw new ApiError(
      isRecord(data) && isText(data.message)
        ? data.message
        : "The request could not be completed.",
      isRecord(data) ? readErrors(data.errors) : undefined,
    );
  if (!validate(data)) throw new ApiError(invalidResponse);
  return data;
}
export const taskApi = {
  list: () =>
    request(
      "/tasks",
      (value): value is Task[] => Array.isArray(value) && value.every(isTask),
    ),
  get: (id: string) =>
    request(
      `/tasks/${encodeURIComponent(id)}`,
      (value): value is Task => isTask(value) && value.id === id,
    ),
  create: (data: TaskInput) =>
    request("/tasks", isTask, { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: TaskInput) =>
    request(
      `/tasks/${encodeURIComponent(id)}`,
      (value): value is Task => isTask(value) && value.id === id,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    ),
  remove: (id: string) =>
    request<{ message: string; id: string }>(
      `/tasks/${encodeURIComponent(id)}`,
      (value): value is { message: string; id: string } =>
        isRecord(value) && isText(value.message) && value.id === id,
      { method: "DELETE" },
    ),
};
export const apiDocsUrl = `${base}/docs`;
