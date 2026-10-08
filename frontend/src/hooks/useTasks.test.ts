import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTasks, useDebounce } from "./useTasks";
import { taskApi } from "../api/tasks";
vi.mock("../api/tasks", () => ({
  taskApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));
const task = {
  id: "a",
  title: "A",
  description: "Detail",
  status: "pending" as const,
  priority: "medium" as const,
  dueDate: null,
  createdAt: "2026-10-08T10:00:00Z",
  updatedAt: "2026-10-08T10:00:00Z",
};
beforeEach(() => vi.resetAllMocks());
describe("task state and async integrity", () => {
  it("refreshes authoritative tasks after creating during a slow initial load", async () => {
    let resolve!: (value: (typeof task)[]) => void;
    const existing = { ...task, id: "existing" };
    vi.mocked(taskApi.list)
      .mockReturnValueOnce(new Promise((r) => (resolve = r)))
      .mockResolvedValueOnce([existing, task]);
    vi.mocked(taskApi.create).mockResolvedValue(task);
    const { result } = renderHook(useTasks);
    await act(async () => {
      await result.current.save(task);
    });
    await act(async () => resolve([existing]));
    expect(result.current.tasks).toEqual([existing, task]);
    expect(result.current.loading).toBe(false);
    expect(taskApi.list).toHaveBeenCalledTimes(2);
  });
  it("does not let a slow refresh restore a deleted task", async () => {
    let resolve!: (value: (typeof task)[]) => void;
    vi.mocked(taskApi.list)
      .mockResolvedValueOnce([task])
      .mockReturnValueOnce(new Promise((r) => (resolve = r)))
      .mockResolvedValueOnce([]);
    vi.mocked(taskApi.remove).mockResolvedValue({
      id: "a",
      message: "Deleted",
    });
    const { result } = renderHook(useTasks);
    await waitFor(() => expect(result.current.tasks).toHaveLength(1));
    act(() => {
      void result.current.load();
    });
    await act(async () => {
      await result.current.remove("a");
    });
    await act(async () => resolve([task]));
    expect(result.current.tasks).toEqual([]);
  });
  it("updates task in memory and retains tasks on mutation failure", async () => {
    vi.mocked(taskApi.list).mockResolvedValue([task]);
    vi.mocked(taskApi.update).mockResolvedValue({ ...task, title: "Updated" });
    const { result } = renderHook(useTasks);
    await waitFor(() => expect(result.current.tasks).toHaveLength(1));
    await act(async () => {
      await result.current.save({ ...task, title: "Updated" }, "a");
    });
    expect(result.current.tasks[0].title).toBe("Updated");
    vi.mocked(taskApi.remove).mockRejectedValue(Error("Offline"));
    await act(async () => {
      await expect(result.current.remove("a")).rejects.toThrow("Offline");
    });
    expect(result.current.tasks).toHaveLength(1);
  });
  it("ignores obsolete requests and unmounted requests", async () => {
    let resolve!: (value: (typeof task)[]) => void;
    vi.mocked(taskApi.list)
      .mockReturnValueOnce(new Promise((r) => (resolve = r)))
      .mockRejectedValueOnce(Error("Latest error"));
    const { result, unmount } = renderHook(useTasks);
    await act(async () => {
      await result.current.load();
    });
    await act(async () => resolve([task]));
    expect(result.current.error).toBe("Latest error");
    unmount();
  });
  it("debounces and replaces pending updates", async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: "a" },
    });
    rerender({ value: "b" });
    expect(result.current).toBe("a");
    rerender({ value: "c" });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("c");
    vi.useRealTimers();
  });
});
