import { afterEach, describe, expect, it, vi } from "vitest";
import { taskApi } from "./tasks";
afterEach(() => vi.unstubAllGlobals());
describe("REST task client", () => {
  it("fetches collection and single task", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ id: "a" }) });
    vi.stubGlobal("fetch", fetch);
    await taskApi.list();
    await taskApi.get("a b");
    expect(fetch.mock.calls[0][0]).toBe("/api/tasks");
    expect(fetch.mock.calls[1][0]).toBe("/api/tasks/a%20b");
  });
  it("serializes create and update and sends delete", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ id: "a" }) });
    vi.stubGlobal("fetch", fetch);
    const payload = {
      title: "A",
      description: "B",
      status: "pending" as const,
      priority: "medium" as const,
      dueDate: null,
    };
    await taskApi.create(payload);
    await taskApi.update("a", payload);
    await taskApi.remove("a");
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
});
