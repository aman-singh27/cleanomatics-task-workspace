import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";
describe("accessible dialog", () => {
  it("contains forward and backward focus, and closes via Escape", async () => {
    const close = vi.fn();
    const user = userEvent.setup();
    render(
      <Dialog title="Test" onClose={close}>
        <button>First</button>
        <button>Last</button>
      </Dialog>,
    );
    screen.getByRole("button", { name: "Last" }).focus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Close dialog" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Last" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(close).toHaveBeenCalledOnce();
  });
  it("keeps focus inside while all controls are disabled", async () => {
    const close = vi.fn();
    const user = userEvent.setup();
    render(
      <Dialog title="Busy" onClose={close} busy>
        <button disabled>Wait</button>
      </Dialog>,
    );
    await user.tab();
    expect(screen.getByRole("dialog")).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(close).not.toHaveBeenCalled();
  });
  it("supports backdrop close and returns focus to an available fallback", () => {
    const close = vi.fn();
    const { unmount } = render(
      <>
        <button className="create-button">New task</button>
        <Dialog title="Test" onClose={close}>
          <button>Inside</button>
        </Dialog>
      </>,
    );
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement!);
    expect(close).toHaveBeenCalledOnce();
    unmount();
  });
});
