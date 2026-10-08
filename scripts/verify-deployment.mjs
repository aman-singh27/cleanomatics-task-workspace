import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect as playwrightExpect } from "@playwright/test";

// Usage: node scripts/verify-deployment.mjs --live-url https://example.vercel.app
// Optional: --api-url https://example.onrender.com/api (or LIVE_URL/API_URL).
function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? undefined : process.argv[index + 1];
}
const liveInput = argument("live-url") || process.env.LIVE_URL;
if (!liveInput) throw new Error("Provide --live-url or LIVE_URL.");
const live = new URL(liveInput);
assert.ok(
  ["http:", "https:"].includes(live.protocol),
  "Use an HTTP(S) live URL.",
);
const api = new URL(argument("api-url") || process.env.API_URL || "/api", live);
assert.ok(
  ["http:", "https:"].includes(api.protocol),
  "Use an HTTP(S) API URL.",
);
const apiBase = api.href.replace(/\/$/, "");
const prefix = `Hosted check ${randomUUID().slice(0, 8)}`;
const report = {
  startedAt: new Date().toISOString(),
  liveUrl: live.origin,
  apiUrl: apiBase,
  status: "running",
  checks: [],
  requests: [],
  pageErrors: [],
  cleanup: { ownedTaskId: null, removed: false },
};
let browser;
let ownedTask;
let deleted = false;
const pendingResponses = [];
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const expect = playwrightExpect.configure({ timeout: 45_000 });

async function check(name, run) {
  const started = Date.now();
  try {
    const detail = await run();
    report.checks.push({
      name,
      status: "passed",
      durationMs: Date.now() - started,
      ...(detail ? { detail } : {}),
    });
    console.log(`Passed: ${name}`);
  } catch (error) {
    report.checks.push({
      name,
      status: "failed",
      durationMs: Date.now() - started,
      message: error.message,
    });
    throw error;
  }
}

async function apiRequest(path, { method = "GET", body, expected = 200 } = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      Origin: live.origin,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(90_000),
  });
  report.requests.push({
    source: "node",
    method,
    path: new URL(response.url).pathname,
    status: response.status,
    requestId: response.headers.get("x-request-id"),
  });
  assert.equal(
    response.status,
    expected,
    `${method} ${path}: unexpected HTTP status`,
  );
  const json = await response.json();
  return { response, json };
}

function observe(page) {
  page.on("pageerror", (error) => report.pageErrors.push(error.message));
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (!url.pathname.includes("/api/")) return;
    const req = response.request();
    report.requests.push({
      source: "browser",
      method: req.method(),
      path: url.pathname,
      status: response.status(),
      requestId: response.headers()["x-request-id"] || null,
    });
    // Keep the ID even if a later UI assertion fails immediately after creation.
    if (
      req.method() === "POST" &&
      /\/tasks\/?$/.test(url.pathname) &&
      response.status() === 201
    ) {
      pendingResponses.push(
        response
          .json()
          .then((task) => {
            if (task.title === prefix && uuid.test(task.id) && !ownedTask) {
              ownedTask = task;
              report.cleanup.ownedTaskId = task.id;
            }
          })
          .catch(() => {}),
      );
    }
  });
}

async function mutation(page, method, click) {
  const waiting = page.waitForResponse(
    (response) => {
      const path = new URL(response.url()).pathname;
      return (
        response.request().method() === method &&
        /\/api\/tasks(?:\/[^/]+)?\/?$/.test(path)
      );
    },
    { timeout: 90_000 },
  );
  await click();
  const response = await waiting;
  assert.equal(
    response.status(),
    method === "POST" ? 201 : 200,
    `${method} UI mutation failed`,
  );
  return response.json();
}

function expectedOrder(tasks, sort) {
  const rank = { high: 0, medium: 1, low: 2 };
  return [...tasks]
    .sort((a, b) => {
      let result;
      if (sort === "priority-desc")
        result = rank[a.priority] - rank[b.priority];
      else if (sort.startsWith("due")) {
        if (!a.dueDate && b.dueDate) return 1;
        if (a.dueDate && !b.dueDate) return -1;
        result =
          (a.dueDate || "").localeCompare(b.dueDate || "") *
          (sort === "due-desc" ? -1 : 1);
      } else
        result =
          a.createdAt.localeCompare(b.createdAt) *
          (sort === "created-asc" ? 1 : -1);
      return result || a.id.localeCompare(b.id);
    })
    .map((task) => task.id);
}

try {
  await check(
    "Health, generated tracing headers, no-store and allowed frontend origin",
    async () => {
      const { response, json } = await apiRequest("/health");
      assert.deepEqual(json, { status: "ok", storage: "memory" });
      assert.match(response.headers.get("x-request-id") || "", uuid);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      assert.equal(
        response.headers.get("access-control-allow-origin"),
        live.origin,
      );
      const list = await apiRequest("/tasks");
      assert.ok(Array.isArray(list.json));
      assert.equal(list.response.headers.get("cache-control"), "no-store");
    },
  );
  await check(
    "Real API invalid-input and missing-record contracts",
    async () => {
      assert.ok(
        (
          await apiRequest("/tasks", {
            method: "POST",
            body: {},
            expected: 400,
          })
        ).json.message,
      );
      const missing = randomUUID();
      for (const method of ["GET", "PUT", "DELETE"]) {
        const { json } = await apiRequest(`/tasks/${missing}`, {
          method,
          expected: 404,
          ...(method === "PUT"
            ? {
                body: {
                  title: `${prefix} missing`,
                  description: "No record should be created.",
                },
              }
            : {}),
        });
        assert.equal(json.message, "Task not found.");
      }
    },
  );
  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(45_000);
  page.setDefaultNavigationTimeout(90_000);
  observe(page);
  const initialResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "GET" &&
      /\/api\/tasks\/?$/.test(new URL(response.url()).pathname),
    { timeout: 90_000 },
  );
  await page.goto(live.origin);
  const initial = await initialResponse;
  assert.equal(initial.status(), 200);
  let workspace = await initial.json();
  assert.ok(Array.isArray(workspace));
  await expect(
    page.getByRole("status", { name: "Loading tasks" }),
  ).not.toBeVisible();
  const dialog = page.getByRole("dialog");
  const search = page.getByRole("searchbox", { name: "Search tasks" });
  const row = () => page.locator(`[data-task-id="${ownedTask.id}"]`);
  const yesterday = new Date(Date.now() - 86_400_000)
    .toISOString()
    .slice(0, 10);
  const original = {
    title: prefix,
    description: `${prefix} dispatch verification`,
    status: "pending",
    priority: "high",
    dueDate: yesterday,
  };

  await check(
    "Required-field feedback and real UI creation returning HTTP 201",
    async () => {
      await page
        .getByRole("button", { name: "New task", exact: true })
        .first()
        .click();
      await dialog
        .getByRole("button", { name: "Create task", exact: true })
        .click();
      await expect(
        dialog.getByText("Add a title for your task."),
      ).toBeVisible();
      await expect(
        dialog.getByText("Add a description for your task."),
      ).toBeVisible();
      await dialog.getByLabel("Title", { exact: true }).fill(original.title);
      await dialog
        .getByLabel("Description", { exact: true })
        .fill(original.description);
      await dialog
        .getByLabel("Priority", { exact: true })
        .selectOption(original.priority);
      await dialog.getByLabel(/^Due date/).fill(original.dueDate);
      ownedTask = await mutation(page, "POST", () =>
        dialog
          .getByRole("button", { name: "Create task", exact: true })
          .click(),
      );
      assert.match(ownedTask.id, uuid);
      report.cleanup.ownedTaskId = ownedTask.id;
      assert.deepEqual(
        Object.fromEntries(
          Object.keys(original).map((key) => [key, ownedTask[key]]),
        ),
        original,
      );
      workspace.push(ownedTask);
      await expect(dialog).not.toBeVisible();
      await search.fill(prefix);
      await expect(row()).toBeVisible();
      await expect(
        page.getByRole("button", {
          name: `All tasks ${workspace.length}`,
          exact: true,
        }),
      ).toBeVisible();
    },
  );
  await check(
    "Task details load the real record and every metadata field",
    async () => {
      await row()
        .getByRole("button", {
          name: `View task ${ownedTask.title}`,
          exact: true,
        })
        .click();
      await expect(
        dialog.getByText(ownedTask.id, { exact: true }),
      ).toBeVisible();
      await expect(
        dialog.getByText(original.description, { exact: true }),
      ).toBeVisible();
      await expect(
        dialog.getByRole("heading", { name: ownedTask.title, exact: true }),
      ).toBeVisible();
      await expect(dialog.getByText("Pending", { exact: true })).toBeVisible();
      await expect(dialog.getByText("High", { exact: true })).toBeVisible();
      for (const label of ["Due date", "Created", "Last updated", "Task ID"])
        await expect(dialog.getByText(label, { exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(
        row().getByRole("button", { name: /^View task / }),
      ).toBeFocused();
    },
  );
  await check(
    "UI editing replaces fields while retaining ID and creation timestamp",
    async () => {
      const createdAt = ownedTask.createdAt;
      const id = ownedTask.id;
      const edited = {
        ...original,
        title: `${prefix} edited`,
        description: `${prefix} verified route and garment counts`,
        priority: "low",
        dueDate: "2027-02-15",
      };
      await row()
        .getByRole("button", { name: "Edit task", exact: true })
        .click();
      await dialog.getByLabel("Title", { exact: true }).fill(edited.title);
      await dialog
        .getByLabel("Description", { exact: true })
        .fill(edited.description);
      await dialog
        .getByLabel("Priority", { exact: true })
        .selectOption(edited.priority);
      await dialog.getByLabel(/^Due date/).fill(edited.dueDate);
      ownedTask = await mutation(page, "PUT", () =>
        dialog.getByRole("button", { name: "Save changes" }).click(),
      );
      assert.equal(ownedTask.id, id);
      assert.equal(ownedTask.createdAt, createdAt);
      for (const [key, value] of Object.entries(edited))
        assert.equal(ownedTask[key], value);
      assert.ok(Date.parse(ownedTask.updatedAt) >= Date.parse(createdAt));
      workspace = workspace.map((task) => (task.id === id ? ownedTask : task));
      await expect(dialog).not.toBeVisible();
      assert.deepEqual((await apiRequest(`/tasks/${id}`)).json, ownedTask);
    },
  );
  await check(
    "Inline status saves, metric totals and metric filter shortcuts",
    async () => {
      for (const status of ["in_progress", "completed"]) {
        ownedTask = await mutation(page, "PUT", () =>
          row()
            .getByRole("combobox", {
              name: `Status for ${ownedTask.title}`,
              exact: true,
            })
            .selectOption(status),
        );
        assert.equal(ownedTask.status, status);
        workspace = workspace.map((task) =>
          task.id === ownedTask.id ? ownedTask : task,
        );
        await expect(
          row().getByRole("combobox", {
            name: `Status for ${ownedTask.title}`,
            exact: true,
          }),
        ).toBeEnabled();
      }
      const completed = workspace.filter(
        (task) => task.status === "completed",
      ).length;
      await expect(
        page.getByRole("button", {
          name: `Completed ${completed}`,
          exact: true,
        }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: `Completed ${completed}`, exact: true })
        .click();
      await expect(page.getByLabel("Status filter")).toHaveValue("completed");
      await expect(search).toHaveValue("");
      await page
        .getByRole("button", {
          name: `All tasks ${workspace.length}`,
          exact: true,
        })
        .click();
      await expect(page.getByLabel("Status filter")).toHaveValue("all");
      await search.fill(prefix);
      await expect(row()).toBeVisible();
      const progress = Math.round((completed / workspace.length) * 100);
      await expect(
        page.getByRole("progressbar", { name: "Task completion" }),
      ).toHaveAttribute("value", String(progress));
    },
  );
  await check(
    "Debounced description search and combined status/priority filters",
    async () => {
      await search.fill(`${prefix} verified route`);
      await expect(row()).toBeVisible();
      await page.getByLabel("Status filter").selectOption("pending");
      await expect(
        page.getByRole("heading", { name: "No tasks match your filters" }),
      ).toBeVisible();
      await page.getByLabel("Status filter").selectOption("completed");
      await page.getByLabel("Priority filter").selectOption("high");
      await expect(
        page.getByRole("heading", { name: "No tasks match your filters" }),
      ).toBeVisible();
      await page.getByLabel("Priority filter").selectOption("low");
      await expect(row()).toBeVisible();
      await search.fill(`${prefix} no match`);
      await expect(
        page.getByRole("heading", { name: "No tasks match your filters" }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Clear filters", exact: true })
        .click();
      await expect(search).toHaveValue("");
      await expect(page.getByLabel("Status filter")).toHaveValue("all");
      await expect(page.getByLabel("Priority filter")).toHaveValue("all");
    },
  );
  await check(
    "All sort modes order actual API records and pagination remains usable",
    async () => {
      for (const sort of [
        "created-desc",
        "created-asc",
        "priority-desc",
        "due-asc",
        "due-desc",
      ]) {
        await page.getByLabel("Sort tasks").selectOption(sort);
        const expected = expectedOrder(workspace, sort).slice(0, 6);
        await expect
          .poll(() =>
            page
              .getByTestId("task-row")
              .evaluateAll((rows) => rows.map((node) => node.dataset.taskId)),
          )
          .toEqual(expected);
      }
      await page.getByLabel("Sort tasks").selectOption("created-desc");
      if (workspace.length > 6) {
        await page.getByRole("button", { name: "Next page" }).click();
        await expect(
          page.getByRole("button", { name: "Previous page" }),
        ).toBeEnabled();
        await page.getByRole("button", { name: "Previous page" }).click();
        await expect(
          page.getByRole("button", { name: "Previous page" }),
        ).toBeDisabled();
        return "Pagination exercised with existing workspace records.";
      }
      await expect(
        page.getByRole("button", { name: "Next page" }),
      ).toBeDisabled();
      return "Single-page boundary verified; shared workspace has six or fewer records.";
    },
  );
  await check(
    "Dark mode persists after reload without storing task records",
    async () => {
      await page.getByRole("button", { name: "Switch to dark mode" }).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      const storage = await page.evaluate(() => ({ ...localStorage }));
      assert.deepEqual(Object.keys(storage), ["cleanomatics-theme"]);
      assert.equal(storage["cleanomatics-theme"], "dark");
      await page.getByRole("button", { name: "Switch to light mode" }).click();
    },
  );
  await check(
    "Mobile navigation, inline status and form layout work without overflow",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await search.fill(prefix);
      await expect(row()).toBeVisible();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await page.getByRole("button", { name: "Open navigation" }).click();
      await page.getByRole("button", { name: "Switch to dark mode" }).click();
      await page
        .getByRole("complementary")
        .getByRole("button", { name: "Close navigation" })
        .click();
      await expect(
        page.getByRole("button", { name: "Open navigation" }),
      ).toBeFocused();
      ownedTask = await mutation(page, "PUT", () =>
        row()
          .getByRole("combobox", {
            name: `Status for ${ownedTask.title}`,
            exact: true,
          })
          .selectOption("pending"),
      );
      assert.equal(ownedTask.status, "pending");
      await expect(
        row().getByRole("combobox", {
          name: `Status for ${ownedTask.title}`,
          exact: true,
        }),
      ).toBeEnabled();
      await row()
        .getByRole("button", { name: "Edit task", exact: true })
        .click();
      await expect(dialog.getByLabel("Title", { exact: true })).toHaveValue(
        ownedTask.title,
      );
      await expect(
        dialog.getByRole("button", { name: "Save changes" }),
      ).toBeVisible();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
    },
  );
  await check(
    "Real UI deletion removes only the verifier's own task",
    async () => {
      await row()
        .getByRole("button", { name: "Delete task", exact: true })
        .click();
      await dialog
        .getByRole("button", { name: "Keep task", exact: true })
        .click();
      await expect(row()).toBeVisible();
      await row()
        .getByRole("button", { name: "Delete task", exact: true })
        .click();
      await mutation(page, "DELETE", () =>
        dialog
          .getByRole("button", { name: "Delete task", exact: true })
          .click(),
      );
      deleted = true;
      report.cleanup.removed = true;
      await expect(dialog).not.toBeVisible();
      await expect(row()).toHaveCount(0);
      await apiRequest(`/tasks/${ownedTask.id}`, { expected: 404 });
    },
  );
  await check(
    "Unknown app path, privacy and terms recover to the task workspace",
    async () => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      for (const [path, heading] of [
        [`/unknown-${prefix.replaceAll(" ", "-")}`, "Page not found"],
        ["/privacy", "Privacy notice"],
        ["/terms", "Terms of use"],
      ]) {
        await page.goto(new URL(path, live).href);
        await expect(
          page.getByRole("heading", { name: heading, exact: true }),
        ).toBeVisible();
        await page
          .getByRole("link", { name: "Back to tasks", exact: true })
          .click();
        await expect(
          page.getByRole("heading", { name: "Operations tasks" }),
        ).toBeVisible();
      }
    },
  );
  await check(
    "Published Swagger and machine-readable OpenAPI document are usable",
    async () => {
      const { json } = await apiRequest("/openapi.json");
      assert.equal(json.openapi, "3.0.3");
      for (const [path, methods] of [
        ["/api/tasks", ["get", "post"]],
        ["/api/tasks/{id}", ["get", "put", "delete"]],
      ]) {
        for (const method of methods) assert.ok(json.paths[path][method]);
      }
      const docs = await context.newPage();
      observe(docs);
      await docs.goto(new URL("/api/docs/", live).href, { timeout: 90_000 });
      await expect(docs.locator(".swagger-ui").first()).toBeVisible();
      const operationCount = Object.values(json.paths).reduce(
        (count, path) =>
          count +
          Object.keys(path).filter((method) =>
            [
              "get",
              "post",
              "put",
              "delete",
              "patch",
              "head",
              "options",
            ].includes(method),
          ).length,
        0,
      );
      await expect(docs.locator(".opblock")).toHaveCount(operationCount);
      const listOperation = docs.locator("#operations-Tasks-listTasks");
      await listOperation.locator(".opblock-summary").click();
      await listOperation.getByRole("button", { name: "Try it out" }).click();
      const executed = docs.waitForResponse(
        (response) =>
          response.request().method() === "GET" &&
          new URL(response.url()).pathname === "/api/tasks",
      );
      await listOperation
        .getByRole("button", { name: "Execute", exact: true })
        .click();
      const executedResponse = await executed;
      assert.equal(executedResponse.status(), 200);
      assert.ok(Array.isArray(await executedResponse.json()));
      await expect(
        listOperation.locator(".responses-inner .live-responses-table"),
      ).toBeVisible();
      await docs.close();
    },
  );
  await check("No unhandled browser errors", async () =>
    assert.deepEqual(report.pageErrors, []),
  );
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = error.message;
  process.exitCode = 1;
  console.error(error.message);
} finally {
  await Promise.allSettled(pendingResponses);
  if (ownedTask && !deleted) {
    try {
      const current = await fetch(`${apiBase}/tasks/${ownedTask.id}`, {
        signal: AbortSignal.timeout(30_000),
      });
      if (current.status === 404) report.cleanup.removed = true;
      else {
        assert.equal(current.status, 200);
        const record = await current.json();
        assert.ok(
          record.title.startsWith(prefix),
          "Refusing to remove a record not owned by this verifier.",
        );
        await apiRequest(`/tasks/${ownedTask.id}`, { method: "DELETE" });
        report.cleanup.removed = true;
      }
    } catch (error) {
      report.cleanup.error = error.message;
      report.status = "failed";
      process.exitCode = 1;
    }
  }
  await browser?.close();
  report.finishedAt = new Date().toISOString();
  await mkdir("output/submission", { recursive: true });
  await writeFile(
    "output/submission/hosted-verification.json",
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(
    `Hosted verification ${report.status}. Report: output/submission/hosted-verification.json`,
  );
}
