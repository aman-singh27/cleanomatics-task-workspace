import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect as playwrightExpect } from "@playwright/test";

const baseURL = process.env.PREVIEW_URL || "http://127.0.0.1:5173";
const directory = "output/playwright/workflows";
const expect = playwrightExpect.configure({ timeout: 45_000 });
const report = {
  baseURL,
  startedAt: new Date().toISOString(),
  screenshots: [],
  pageErrors: [],
  cleanup: false,
};
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
let ownedId;
let ownedTitle;
let removed = false;
let api;
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(90_000);
  page.on("pageerror", (error) => report.pageErrors.push(error.message));
  await page.goto(baseURL, { timeout: 90_000 });
  await expect(page.getByTestId("task-row").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  api = await page.evaluate(() => new URL("/api", window.location.href).href);
  const dialog = page.getByRole("dialog");
  const search = page.getByLabel("Search tasks");
  const row = () =>
    page.getByTestId("task-row").filter({
      has: page.getByRole("button", {
        name: `View task ${ownedTitle}`,
        exact: true,
      }),
    });
  const capture = async (name) => {
    await page.screenshot({
      path: `${directory}/${name}.png`,
      fullPage: false,
    });
    report.screenshots.push(`${name}.png`);
    console.log(`Captured: ${name}`);
  };
  const mutate = async (method, action) => {
    const result = page.waitForResponse(
      (response) =>
        response.request().method() === method &&
        /\/api\/tasks(?:\/[^/]+)?\/?$/.test(new URL(response.url()).pathname),
    );
    await action();
    const response = await result;
    assert.equal(response.status(), method === "POST" ? 201 : 200);
    const task = await response.json();
    if (method === "POST") {
      ownedId = task.id;
      ownedTitle = task.title;
    }
    return task;
  };
  const date = (offset) => {
    const value = new Date();
    value.setDate(value.getDate() + offset);
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(value);
  };
  await page
    .getByRole("button", { name: "New task", exact: true })
    .first()
    .click();
  await dialog
    .getByRole("button", { name: "Create task", exact: true })
    .click();
  await expect(dialog.getByText("Add a title for your task.")).toBeVisible();
  await capture("01-form-validation");
  const original = {
    title: "Confirm hospital linen dispatch",
    description:
      "Verify sealed linen counts with the hospital coordinator and confirm the morning delivery window.",
    status: "pending",
    priority: "high",
    dueDate: date(2),
  };
  await dialog.getByLabel("Title", { exact: true }).fill(original.title);
  await dialog
    .getByLabel("Description", { exact: true })
    .fill(original.description);
  await dialog
    .getByLabel("Priority", { exact: true })
    .selectOption(original.priority);
  await dialog.getByLabel(/^Due date/).fill(original.dueDate);
  await capture("02-create-task");
  const created = await mutate("POST", () =>
    dialog.getByRole("button", { name: "Create task", exact: true }).click(),
  );
  assert.match(created.id, /^[0-9a-f-]{36}$/i);
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("Task created.", { exact: true })).toBeVisible();
  await capture("03-task-created");
  await search.fill(ownedTitle);
  await expect(row()).toBeVisible();
  await row().getByRole("button", { name: "Edit task", exact: true }).click();
  const edited = {
    ...original,
    title: "Confirm hospital linen dispatch and quality",
    description:
      "Dispatch window agreed for 08:30. Check sealed linen counts and attach the quality inspection record before loading.",
    dueDate: date(-1),
  };
  await dialog.getByLabel("Title", { exact: true }).fill(edited.title);
  await dialog
    .getByLabel("Description", { exact: true })
    .fill(edited.description);
  await dialog.getByLabel(/^Due date/).fill(edited.dueDate);
  await capture("04-edit-task");
  const updated = await mutate("PUT", () =>
    dialog.getByRole("button", { name: "Save changes", exact: true }).click(),
  );
  ownedTitle = updated.title;
  assert.equal(updated.id, ownedId);
  assert.equal(updated.createdAt, created.createdAt);
  await search.fill("Confirm hospital linen dispatch");
  await expect(dialog).not.toBeVisible();
  await expect(row()).toBeVisible();
  await expect(page.getByText("Task updated.", { exact: true })).toBeVisible();
  await capture("05-task-updated");
  const status = () =>
    row().getByRole("combobox", {
      name: `Status for ${ownedTitle}`,
      exact: true,
    });
  const progress = await mutate("PUT", () =>
    status().selectOption("in_progress"),
  );
  assert.equal(progress.status, "in_progress");
  await expect(status()).toBeEnabled();
  await expect(status()).toHaveValue("in_progress");
  await capture("06-status-in-progress");
  const completed = await mutate("PUT", () =>
    status().selectOption("completed"),
  );
  assert.equal(completed.status, "completed");
  await expect(status()).toBeEnabled();
  await expect(status()).toHaveValue("completed");
  await capture("07-task-completed");
  await search.fill("quality inspection record");
  await page.getByLabel("Status filter").selectOption("completed");
  await page.getByLabel("Priority filter").selectOption("high");
  await expect(row()).toBeVisible();
  await capture("08-search-and-filters");
  await page
    .getByRole("region", { name: "Task overview" })
    .getByRole("button", { name: /^Overdue \d+$/ })
    .click();
  await expect(page.getByLabel("Status filter")).toHaveValue("overdue");
  await capture("09-overdue-queue");
  await page
    .getByRole("region", { name: "Task overview" })
    .getByRole("button", { name: /^All tasks \d+$/ })
    .click();
  await page.getByLabel("Sort tasks").selectOption("due-asc");
  await expect(page.getByRole("button", { name: "Next page" })).toBeEnabled();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText(/^Page 2 of /)).toBeVisible();
  await capture("10-pagination");
  await search.fill(ownedTitle);
  await expect(row()).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await row().getByRole("button", { name: "Edit task", exact: true }).click();
  await expect(dialog.getByLabel("Title", { exact: true })).toHaveValue(
    ownedTitle,
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await capture("11-mobile-edit");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await row().getByRole("button", { name: "Delete task", exact: true }).click();
  await expect(
    dialog.getByRole("heading", { name: "Delete task", exact: true }),
  ).toBeVisible();
  await capture("12-delete-confirmation");
  await mutate("DELETE", () =>
    dialog.getByRole("button", { name: "Delete task", exact: true }).click(),
  );
  removed = true;
  report.cleanup = true;
  await expect(dialog).not.toBeVisible();
  await search.fill("");
  await expect(page.getByTestId("task-row").first()).toBeVisible();
  await expect(page.getByText("Task deleted.", { exact: true })).toBeVisible();
  await capture("13-task-deleted");
  await search.fill("No matching dispatch record");
  await expect(
    page.getByRole("heading", { name: "No tasks match your filters" }),
  ).toBeVisible();
  await capture("14-no-matching-tasks");
  await page.goto(new URL("/api/docs/", baseURL).href);
  await expect(page.locator(".swagger-ui").first()).toBeVisible();
  await page
    .getByRole("button", { name: "GET /api/tasks List all tasks", exact: true })
    .click();
  await page.getByRole("button", { name: "Try it out", exact: true }).click();
  const docsResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "GET" &&
      new URL(response.url()).pathname === "/api/tasks",
  );
  await page.getByRole("button", { name: "Execute", exact: true }).click();
  assert.equal((await docsResponse).status(), 200);
  await expect(page.locator(".live-responses-table")).toBeVisible();
  await capture("15-swagger-api");
  await page.goto(new URL("/missing-workspace-page", baseURL).href);
  await expect(
    page.getByRole("heading", { name: "Page not found", exact: true }),
  ).toBeVisible();
  await capture("16-page-not-found");
  assert.deepEqual(report.pageErrors, []);
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = error.message;
  process.exitCode = 1;
  console.error(error);
} finally {
  if (ownedId && !removed) {
    try {
      const current = await fetch(`${api}/tasks/${ownedId}`, {
        signal: AbortSignal.timeout(90_000),
      });
      if (current.status !== 404) {
        assert.equal(current.status, 200);
        const record = await current.json();
        assert.ok(
          record.title.startsWith("Confirm hospital linen dispatch"),
          "Refusing to delete an unrelated record.",
        );
        const response = await fetch(`${api}/tasks/${ownedId}`, {
          method: "DELETE",
          signal: AbortSignal.timeout(90_000),
        });
        assert.equal(response.status, 200);
      }
      report.cleanup = true;
    } catch (error) {
      report.cleanupError = error.message;
      report.status = "failed";
      process.exitCode = 1;
    }
  }
  await browser.close();
  report.finishedAt = new Date().toISOString();
  await writeFile(
    `${directory}/capture-report.json`,
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify(report));
}
