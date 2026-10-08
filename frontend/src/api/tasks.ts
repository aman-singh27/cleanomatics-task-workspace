import type { Task, TaskInput } from "../lib/tasks";
export class ApiError extends Error {
  errors?: Record<string, string>;
  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    this.errors = errors;
  }
}
const base = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(
      data.message || "The request could not be completed.",
      data.errors,
    );
  return data as T;
}
export const taskApi = {
  list: () => request<Task[]>("/tasks"),
  get: (id: string) => request<Task>(`/tasks/${encodeURIComponent(id)}`),
  create: (data: TaskInput) =>
    request<Task>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: TaskInput) =>
    request<Task>(`/tasks/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    request<{ message: string; id: string }>(
      `/tasks/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),
};
export const apiDocsUrl = `${base}/docs`;
