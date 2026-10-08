import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InlineTaskStatus } from "./InlineTaskStatus";
import type { Task } from "../lib/tasks";
const task: Task = {
  id: "1",
  title: "Review delivery",
  description: "Confirm the schedule.",
  status: "pending",
  priority: "high",
  dueDate: null,
  createdAt: "2026-10-08T10:00:00Z",
  updatedAt: "2026-10-08T10:00:00Z",
};
describe("inline task status", () => {
  it("does not steal focus if the user moves elsewhere during save", async () => {
    let finish: () => void = () => {};
    const save = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(
      <>
        <InlineTaskStatus task={task} onChange={save} />
        <button>Another task</button>
      </>,
    );
    await userEvent.selectOptions(screen.getByRole("combobox"), "completed");
    const other = screen.getByRole("button", { name: "Another task" });
    await userEvent.click(other);
    finish();
    await waitFor(() => expect(screen.getByRole("combobox")).toBeEnabled());
    expect(other).toHaveFocus();
  });
  it("saves status without opening an editor and disables duplicate changes while pending", async () => {
    let finish: () => void = () => {};
    const save = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(<InlineTaskStatus task={task} onChange={save} />);
    const control = screen.getByRole("combobox", {
      name: "Status for Review delivery",
    });
    await userEvent.selectOptions(control, "completed");
    expect(save).toHaveBeenCalledWith(task, "completed");
    expect(control).toBeDisabled();
    finish();
    await waitFor(() => expect(control).toBeEnabled());
  });
  it("retains previous status and exposes save failure for another attempt", async () => {
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error("Status could not be saved."))
      .mockResolvedValueOnce(undefined);
    render(<InlineTaskStatus task={task} onChange={save} />);
    const control = screen.getByRole("combobox", {
      name: "Status for Review delivery",
    });
    await userEvent.selectOptions(control, "in_progress");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Status could not be saved.",
    );
    expect(control).toHaveValue("pending");
    await userEvent.selectOptions(control, "completed");
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
    expect(save).toHaveBeenCalledTimes(2);
  });
});
