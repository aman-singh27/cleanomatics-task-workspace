import { afterEach, describe, expect, it, vi } from "vitest";
import type { Task, TaskInput } from "../lib/tasks";
import { ApiError, taskApi } from "./tasks";
const task: Task = {
  id: "9caad4e5-0a3a-4906-a01a-bd01a5a6e315",
  title: "Check delivery",
  description: "Confirm the delivery window with the customer.",
  status: "pending",
  priority: "medium",
  dueDate: "2026-10-09",
  createdAt: "2026-10-08T09:30:00.000Z",
  updatedAt: "2026-10-08T09:30:00.000Z",
};
const payload: TaskInput = {
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  dueDate: task.dueDate,
};
function respond(data: unknown, ok = true) {
  const fetch = vi.fn().mockResolvedValue({ ok, json: async () => data });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
afterEach(() => vi.unstubAllGlobals());
describe("REST task client", () => {
  it("fetches collection and single task", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [task] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...task, id: "a b" }),
      });
    vi.stubGlobal("fetch", fetch);
    await expect(taskApi.list()).resolves.toEqual([task]);
    await expect(taskApi.get("a b")).resolves.toEqual({ ...task, id: "a b" });
    expect(fetch.mock.calls[0][0]).toBe("/api/tasks");
    expect(fetch.mock.calls[1][0]).toBe("/api/tasks/a%20b");
    respond([]);
    await expect(taskApi.list()).resolves.toEqual([]);
  });
  it("serializes create and update and sends delete", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => task })
      .mockResolvedValueOnce({ ok: true, json: async () => task })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Deleted", id: task.id }),
      });
    vi.stubGlobal("fetch", fetch);
    await expect(taskApi.create(payload)).resolves.toEqual(task);
    await expect(taskApi.update(task.id, payload)).resolves.toEqual(task);
    await expect(taskApi.remove(task.id)).resolves.toEqual({
      message: "Deleted",
      id: task.id,
    });
    expect(fetch.mock.calls[0][1].method).toBe("POST");
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual(payload);
    expect(fetch.mock.calls[2][1].method).toBe("DELETE");
  });
  it("preserves API validation and network failure messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          message: "Invalid task",
          errors: { title: "Required" },
        }),
      }),
    );
    await expect(taskApi.list()).rejects.toMatchObject({
      message: "Invalid task",
      errors: { title: "Required" },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    await expect(taskApi.list()).rejects.toThrow("Unable to reach");
  });
  it("handles a non JSON error response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => {
          throw Error("html");
        },
      }),
    );
    await expect(taskApi.list()).rejects.toThrow(
      "The request could not be completed.",
    );
  });
  it("accepts all enum values and a missing optional due date", async () => {
    for (const status of ["pending", "in_progress", "completed"] as const) {
      for (const priority of ["low", "medium", "high"] as const) {
        const record = { ...task, status, priority, dueDate: null };
        respond(record);
        await expect(taskApi.get(task.id)).resolves.toEqual(record);
      }
    }
  });
  it.each(
    [null, {}, "html", [task, { id: "incomplete" }]].map((data) => [data]),
  )("rejects a malformed collection (%j)", async (data) => {
    respond(data);
    await expect(taskApi.list()).rejects.toThrow(ApiError);
    await expect(taskApi.list()).rejects.toThrow("try again");
  });
  it.each(
    [
      null,
      [],
      {},
      { ...task, id: "" },
      { ...task, title: 12 },
      { ...task, title: " " },
      { ...task, description: null },
      { ...task, status: "blocked" },
      { ...task, priority: "urgent" },
      { ...task, dueDate: undefined },
      { ...task, dueDate: "2026-02-30" },
      { ...task, dueDate: "0000-01-01" },
      { ...task, dueDate: "2026-10-09T00:00:00Z" },
      { ...task, createdAt: "yesterday" },
      { ...task, updatedAt: null },
    ].map((data) => [data]),
  )("rejects a malformed single task (%j)", async (data) => {
    respond(data);
    await expect(taskApi.get(task.id)).rejects.toThrow(ApiError);
  });
  it("rejects malformed successful create and update responses", async () => {
    respond({ id: task.id });
    await expect(taskApi.create(payload)).rejects.toThrow(ApiError);
    await expect(taskApi.update(task.id, payload)).rejects.toThrow(ApiError);
  });
  it("rejects a successful GET returning a different task", async () => {
    respond({ ...task, id: "another-task" });
    await expect(taskApi.get(task.id)).rejects.toThrow(ApiError);
  });
  it("rejects a successful update returning a different task", async () => {
    respond({ ...task, id: "another-task" });
    await expect(taskApi.update(task.id, payload)).rejects.toThrow(ApiError);
  });
  it.each([
    null,
    {},
    { message: "Deleted", id: 12 },
    { message: "Deleted", id: "another-task" },
    { message: null, id: task.id },
  ])("rejects an invalid delete confirmation (%j)", async (data) => {
    respond(data);
    await expect(taskApi.remove(task.id)).rejects.toThrow(ApiError);
  });
  it.each(
    [null, [], "error", { message: { html: "bad" }, errors: null }].map(
      (data) => [data],
    ),
  )("handles malformed error bodies safely (%j)", async (data) => {
    respond(data, false);
    await expect(taskApi.list()).rejects.toMatchObject({
      message: "The request could not be completed.",
    });
  });
  it("ignores invalid field errors so error rendering remains safe", async () => {
    respond(
      {
        message: "Invalid task",
        errors: { title: "Required", description: {} },
      },
      false,
    );
    await expect(taskApi.create(payload)).rejects.toMatchObject({
      message: "Invalid task",
      errors: { title: "Required" },
    });
  });
  it("rejects non JSON successful responses with a recovery message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw Error("html");
        },
      }),
    );
    await expect(taskApi.list()).rejects.toThrow("try again");
  });
});
