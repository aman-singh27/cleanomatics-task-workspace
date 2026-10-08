import { describe, expect, it } from "vitest";
import { selectTasks, validateTask, formatDate, type Task } from "./tasks";
const task = (id: string, overrides = {}): Task => ({
  id,
  title: "Scan garments",
  description: "Quality check",
  status: "pending",
  priority: "medium",
  dueDate: null,
  createdAt: "2026-10-08T10:00:00Z",
  updatedAt: "2026-10-08T10:00:00Z",
  ...overrides,
});
describe("task selection", () => {
  it("searches descriptions and combines filters before pagination", () => {
    const tasks = [
      task("a"),
      task("b", { status: "completed" }),
      task("c", {
        title: "Orders",
        description: "Scan more",
        priority: "high",
      }),
    ];
    expect(
      selectTasks(tasks, "scan", "pending", "high", "created-desc").map(
        (t) => t.id,
      ),
    ).toEqual(["c"]);
  });
  it("sorts priority and breaks ties by id", () =>
    expect(
      selectTasks(
        [task("b"), task("a"), task("c", { priority: "high" })],
        "",
        "all",
        "all",
        "priority-desc",
      ).map((t) => t.id),
    ).toEqual(["c", "a", "b"]));
  it("sorts due date with null dates always last", () => {
    const tasks = [
      task("a"),
      task("b", { dueDate: "2026-10-09" }),
      task("c", { dueDate: "2026-10-08" }),
    ];
    expect(
      selectTasks(tasks, "", "all", "all", "due-asc").map((t) => t.id),
    ).toEqual(["c", "b", "a"]);
    expect(
      selectTasks(tasks, "", "all", "all", "due-desc").map((t) => t.id),
    ).toEqual(["b", "c", "a"]);
  });
  it("sorts created ascending and descending", () => {
    const tasks = [task("a", { createdAt: "2026-10-07T10:00:00Z" }), task("b")];
    expect(selectTasks(tasks, "", "all", "all", "created-desc")[0].id).toBe(
      "b",
    );
    expect(selectTasks(tasks, "", "all", "all", "created-asc")[0].id).toBe("a");
  });
  it("validates required lengths and true calendar dates", () => {
    expect(
      validateTask({ title: " ", description: " ", dueDate: "2026-02-30" }),
    ).toEqual({
      title: "Add a title for your task.",
      description: "Add a description for your task.",
      dueDate: "Choose a valid calendar date.",
    });
    expect(
      validateTask({
        title: "x".repeat(121),
        description: "x".repeat(2001),
        dueDate: "2024-02-29",
      }),
    ).toEqual({
      title: "Keep the title under 121 characters.",
      description: "Keep the description under 2,001 characters.",
    });
    expect(
      validateTask({ title: "Fine", description: "Details", dueDate: "" }),
    ).toEqual({});
  });
  it("formats date-only values locally without timezone drift", () => {
    expect(formatDate("2026-10-08")).toBe("08 Oct 2026");
    expect(formatDate(null)).toBe("No due date");
  });
});
