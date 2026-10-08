import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { taskApi } from "./api/tasks";
vi.mock("./api/tasks", () => ({
  apiDocsUrl: "/api/docs",
  taskApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));
const fixture = {
  id: "1",
  title: "Prepare launch",
  description: "Review the operations checklist",
  status: "pending" as const,
  priority: "high" as const,
  dueDate: "2026-10-12",
  createdAt: "2026-10-08T10:00:00Z",
  updatedAt: "2026-10-08T10:00:00Z",
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(taskApi.list).mockResolvedValue([fixture]);
  vi.mocked(taskApi.get).mockResolvedValue(fixture);
  vi.mocked(taskApi.create).mockImplementation(async (data) => ({
    ...fixture,
    ...data,
  }));
  vi.mocked(taskApi.update).mockImplementation(async (_, data) => ({
    ...fixture,
    ...data,
  }));
  vi.mocked(taskApi.remove).mockResolvedValue({ id: "1", message: "Deleted" });
});
describe("workspace journeys", () => {
  it("keeps status navigation in dashboard metrics and out of sidebar", async () => {
    render(<App />);
    await screen.findByRole("button", { name: "View task Prepare launch" });
    const overview = screen.getByRole("region", { name: "Task overview" });
    const all = within(overview).getByRole("button", { name: "All tasks 1" });
    expect(all).toHaveAttribute("aria-pressed", "true");
    const completed = within(overview).getByRole("button", {
      name: "Completed 0",
    });
    await userEvent.click(completed);
    expect(completed).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Status filter")).toHaveValue("completed");
    expect(
      within(screen.getByRole("complementary")).queryByRole("button", {
        name: /All tasks|In progress|Completed/,
      }),
    ).not.toBeInTheDocument();
  });
  it("returns focus to the task after closing an editor opened from details", async () => {
    const user = userEvent.setup();
    render(<App />);
    const trigger = await screen.findByRole("button", {
      name: "View task Prepare launch",
    });
    await user.click(trigger);
    await within(screen.getByRole("dialog")).findByText("Created");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Edit task",
      }),
    );
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
  it("shows tasks and real summaries; opens API-fetched details", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "View task Prepare launch" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Task details" }),
    ).toBeVisible();
    expect(taskApi.get).toHaveBeenCalledWith("1");
    expect(
      within(screen.getByRole("dialog")).getByText("Created"),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(
      screen.getByRole("button", { name: "View task Prepare launch" }),
    ).toHaveFocus();
  });
  it("validates and creates, with success feedback", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("button", { name: "View task Prepare launch" });
    await user.click(
      screen.getByRole("button", { name: "New task", exact: true }),
    );
    let dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Create task" }),
    );
    expect(
      within(dialog).getByText("Add a title for your task."),
    ).toBeVisible();
    await user.type(within(dialog).getByLabelText("Title"), "New delivery");
    await user.type(
      within(dialog).getByLabelText("Description"),
      "Check everything",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Create task" }),
    );
    expect(await screen.findByText("Task created.")).toBeVisible();
    expect(taskApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New delivery",
        description: "Check everything",
      }),
    );
  });
  it("edits task and confirms deletion", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Edit task" }));
    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Launch ready");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Task updated.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Delete task" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Delete task",
      }),
    );
    expect(await screen.findByText("Task deleted.")).toBeVisible();
    expect(taskApi.remove).toHaveBeenCalledWith("1");
  });
  it("searches descriptions, filters and clears no matches", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("button", { name: "View task Prepare launch" });
    await user.type(
      screen.getByRole("searchbox", { name: "Search tasks" }),
      "checklist",
    );
    expect(
      await screen.findByRole("button", { name: "View task Prepare launch" }),
    ).toBeVisible();
    await user.selectOptions(
      screen.getByLabelText("Status filter"),
      "completed",
    );
    expect(
      await screen.findByText("No tasks match your filters"),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(
      await screen.findByRole("button", { name: "View task Prepare launch" }),
    ).toBeVisible();
  });
  it("provides retry for initial load errors and a meaningful empty state", async () => {
    vi.mocked(taskApi.list)
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValueOnce([]);
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByText("Offline")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("No tasks yet")).toBeVisible();
  });
  it("keeps form values on failed save; Escape closes dialog and theme persists", async () => {
    vi.mocked(taskApi.create).mockRejectedValue(new Error("Connection lost"));
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("button", { name: "View task Prepare launch" });
    await user.click(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    );
    expect(localStorage.getItem("cleanomatics-theme")).toBe("dark");
    await user.click(
      screen.getByRole("button", { name: "New task", exact: true }),
    );
    await user.type(screen.getByLabelText("Title"), "Keep me");
    await user.type(screen.getByLabelText("Description"), "Details");
    await user.click(screen.getByRole("button", { name: "Create task" }));
    expect(await screen.findByText("Connection lost")).toBeVisible();
    expect(screen.getByLabelText("Title")).toHaveValue("Keep me");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("paginates, sorts, changes priority, and uses working navigation", async () => {
    const records = Array.from({ length: 8 }, (_, i) => ({
      ...fixture,
      id: String(i),
      title: `Task ${i}`,
      status:
        i === 0
          ? ("completed" as const)
          : i === 1
            ? ("in_progress" as const)
            : ("pending" as const),
      priority:
        i === 2
          ? ("low" as const)
          : i === 3
            ? ("medium" as const)
            : ("high" as const),
    }));
    vi.mocked(taskApi.list).mockResolvedValue(records);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("button", { name: "View task Task 0" });
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(
      screen.getByRole("button", { name: "View task Task 6" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Previous page" }));
    await user.selectOptions(
      screen.getByLabelText("Sort tasks"),
      "priority-desc",
    );
    await user.selectOptions(screen.getByLabelText("Priority filter"), "low");
    expect(
      await screen.findByRole("button", { name: "View task Task 2" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(
      screen.getByRole("button", { name: "Open navigation" }),
    ).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: /In progress 1/ }));
    expect(
      await screen.findByRole("button", { name: "View task Task 1" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: /All tasks 8/ }));
    await user.click(screen.getByRole("button", { name: /Completed 1/ }));
    expect(
      await screen.findByRole("button", { name: "View task Task 0" }),
    ).toBeVisible();
  });
  it("edits all fields from details and toggles back to light", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "View task Prepare launch" }),
    );
    await within(screen.getByRole("dialog")).findByText("Created");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Edit task",
      }),
    );
    await user.selectOptions(screen.getByLabelText("Status"), "completed");
    await user.selectOptions(screen.getByLabelText("Priority"), "low");
    fireEvent.change(screen.getByLabelText("Due date"), {
      target: { value: "2026-12-10" },
    });
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Task completion")).toBeVisible();
    expect(taskApi.update).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({
        status: "completed",
        priority: "low",
        dueDate: "2026-12-10",
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Switch to light mode" }),
    );
    expect(localStorage.getItem("cleanomatics-theme")).toBe("light");
    await user.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    expect(screen.queryByText("Task updated.")).not.toBeInTheDocument();
  });
  it("retries task details, retains delete failure, and cancels safely", async () => {
    vi.mocked(taskApi.get)
      .mockRejectedValueOnce(Error("Details unavailable"))
      .mockResolvedValueOnce(fixture);
    vi.mocked(taskApi.remove).mockRejectedValue(Error("Cannot delete"));
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      await screen.findByRole("button", { name: "View task Prepare launch" }),
    );
    expect(await screen.findByText("Details unavailable")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    await within(screen.getByRole("dialog")).findByText("Created");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Delete task",
      }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Delete task",
      }),
    );
    expect(await screen.findByText("Cannot delete")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Keep task" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "View task Prepare launch" }),
    ).toBeVisible();
  });
  it("supports the search shortcut and cancels a new task", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("button", { name: "View task Prepare launch" });
    await user.keyboard("/");
    expect(screen.getByRole("searchbox")).toHaveFocus();
    await user.click(
      screen.getByRole("button", { name: "New task", exact: true }),
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
