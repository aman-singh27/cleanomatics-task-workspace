import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RouteBoundary, AppErrorBoundary } from "./RouteBoundary";

afterEach(() => vi.restoreAllMocks());
describe("application fallback pages", () => {
  it("renders the task app for its valid route", () => {
    render(
      <RouteBoundary path="/">
        <div>Task application</div>
      </RouteBoundary>,
    );
    expect(screen.getByText("Task application")).toBeInTheDocument();
  });
  it("shows useful 404 navigation without mounting task data on an unknown route", () => {
    render(
      <RouteBoundary path="/missing">
        <div>Task application</div>
      </RouteBoundary>,
    );
    expect(
      screen.getByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Task application")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to tasks" })).toHaveAttribute(
      "href",
      "/",
    );
  });
  it("provides accurate local privacy and usage notes", () => {
    const view = render(
      <RouteBoundary path="/privacy">
        <div>Tasks</div>
      </RouteBoundary>,
    );
    expect(
      screen.getByRole("heading", { name: "Privacy notice" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/theme preference/i)).toBeInTheDocument();
    view.rerender(
      <RouteBoundary path="/terms">
        <div>Tasks</div>
      </RouteBoundary>,
    );
    expect(
      screen.getByRole("heading", { name: "Terms of use" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/backend restarts/i)).toBeInTheDocument();
  });
  it("contains unexpected rendering failures and can retry recovered children", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let failed = true;
    function Child() {
      if (failed) throw new Error("Private diagnostic data");
      return <p>Recovered tasks</p>;
    }
    render(
      <AppErrorBoundary>
        <Child />
      </AppErrorBoundary>,
    );
    expect(
      screen.getByRole("heading", { name: "Something went wrong" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Private diagnostic data"),
    ).not.toBeInTheDocument();
    failed = false;
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByText("Recovered tasks")).toBeInTheDocument();
  });
});
