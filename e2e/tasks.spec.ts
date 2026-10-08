import { test, expect, type Page } from "@playwright/test";

const api = "http://127.0.0.1:4001/api";
const sample = {
  title: "Prepare laundry pickup",
  description: "Confirm routes and garment counts for tomorrow.",
  status: "pending",
  priority: "high",
  dueDate: "2026-10-09",
};

test.beforeEach(async ({ request }) => {
  const response = await request.get(`${api}/tasks`);
  for (const task of await response.json())
    await request.delete(`${api}/tasks/${task.id}`);
});

async function openCreate(page: Page) {
  await page
    .getByRole("button", { name: "New task", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

test("complete real API workflow: required fields, create, details, edit, delete", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await openCreate(page);
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Create task", exact: true })
    .click();
  await expect(dialog.getByText("Add a title for your task.")).toBeVisible();
  await expect(
    dialog.getByText("Add a description for your task."),
  ).toBeVisible();
  expect(await (await request.get(`${api}/tasks`)).json()).toHaveLength(0);
  await dialog.getByLabel("Title", { exact: true }).fill(sample.title);
  await dialog
    .getByLabel("Description", { exact: true })
    .fill(sample.description);
  await dialog
    .getByLabel("Status", { exact: true })
    .selectOption(sample.status);
  await dialog
    .getByLabel("Priority", { exact: true })
    .selectOption(sample.priority);
  await dialog.getByLabel(/^Due date/).fill(sample.dueDate);
  await dialog
    .getByRole("button", { name: "Create task", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", {
      name: `View task ${sample.title}`,
      exact: true,
    }),
  ).toBeVisible();
  const created = (await (await request.get(`${api}/tasks`)).json())[0];
  expect(created).toMatchObject(sample);

  await page
    .getByRole("button", { name: `View task ${sample.title}`, exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "Task details" }),
  ).toBeVisible();
  await expect(
    dialog.getByText(sample.description, { exact: true }),
  ).toBeVisible();
  await expect(dialog.getByText(created.id, { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", {
      name: `View task ${sample.title}`,
      exact: true,
    }),
  ).toBeFocused();

  await page
    .getByTestId("task-row")
    .filter({ hasText: sample.title })
    .getByRole("button", { name: "Edit task", exact: true })
    .click();
  await dialog
    .getByLabel("Title", { exact: true })
    .fill("Prepare updated pickup");
  await dialog
    .getByLabel("Description", { exact: true })
    .fill("Route confirmed with operations team.");
  await dialog.getByLabel("Status", { exact: true }).selectOption("completed");
  await dialog.getByLabel("Priority", { exact: true }).selectOption("low");
  await dialog.getByLabel(/^Due date/).fill("2026-10-10");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).not.toBeVisible();
  expect(
    await (await request.get(`${api}/tasks/${created.id}`)).json(),
  ).toMatchObject({
    title: "Prepare updated pickup",
    description: "Route confirmed with operations team.",
    status: "completed",
    priority: "low",
    dueDate: "2026-10-10",
    createdAt: created.createdAt,
  });
  await page
    .getByTestId("task-row")
    .filter({ hasText: "Prepare updated pickup" })
    .getByRole("button", { name: "Delete task", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "Delete task" }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Delete task", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "View task Prepare updated pickup",
      exact: true,
    }),
  ).toHaveCount(0);
  expect((await request.get(`${api}/tasks/${created.id}`)).status()).toBe(404);
});

test("combined debounced search and filters; sorting; pagination", async ({
  page,
  request,
}) => {
  for (let i = 0; i < 14; i++) {
    await request.post(`${api}/tasks`, {
      data: {
        title: `Operations ${String(i).padStart(2, "0")}`,
        description:
          i === 3 ? "Unique garment inspection" : "Routine operations",
        status: i % 2 ? "in_progress" : "pending",
        priority: i % 3 ? "low" : "high",
        dueDate: i === 13 ? null : `2026-10-${String(i + 10).padStart(2, "0")}`,
      },
    });
  }
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Next page" })).toBeEnabled();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(
    page.getByRole("button", { name: "Previous page" }),
  ).toBeEnabled();
  await page.getByRole("searchbox", { name: "Search tasks" }).fill("garment");
  await expect(
    page.getByRole("button", { name: "View task Operations 03", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Next page" })).toBeDisabled();
  await page.getByLabel("Status filter").selectOption("pending");
  await expect(page.getByText(/no.*match/i)).toBeVisible();
  await page.getByLabel("Status filter").selectOption("in_progress");
  await page.getByLabel("Priority filter").selectOption("high");
  await expect(
    page.getByRole("button", { name: "View task Operations 03", exact: true }),
  ).toBeVisible();
  await page.getByRole("searchbox", { name: "Search tasks" }).fill("");
  await page.getByLabel("Status filter").selectOption("all");
  await page.getByLabel("Priority filter").selectOption("all");
  const sort = page.getByLabel("Sort tasks");
  await sort.selectOption({ label: "Due date: earliest first" });
  await expect(
    page.getByRole("button", { name: "View task Operations 00", exact: true }),
  ).toBeVisible();
  await sort.selectOption({ label: "Priority: high first" });
  await expect(
    page.getByRole("button", { name: "View task Operations 03", exact: true }),
  ).toBeVisible();
  await sort.selectOption({ label: "Newest first" });
  await expect(
    page.getByRole("button", { name: "View task Operations 13", exact: true }),
  ).toBeVisible();
});

test("server failure recovers through Retry; slow fetch shows loading; empty state", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/api/tasks", async (route) => {
    if (route.request().method() === "GET" && fail)
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "Temporarily unavailable" }),
      });
    else await route.continue();
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
  fail = false;
  await page.getByRole("button", { name: /retry/i }).click();
  await expect(
    page.getByRole("heading", { name: "No tasks yet" }),
  ).toBeVisible();
  await page.unroute("**/api/tasks");
  await page.route("**/api/tasks", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });
  await page.reload();
  await expect(
    page.getByRole("status", { name: "Loading tasks" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No tasks yet" }),
  ).toBeVisible();
});

test("failed mutation retains form values and allows retry", async ({
  page,
}) => {
  await page.goto("/");
  await openCreate(page);
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title", { exact: true }).fill(sample.title);
  await dialog
    .getByLabel("Description", { exact: true })
    .fill(sample.description);
  await page.route("**/api/tasks", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "Save failed. Try again." }),
        })
      : route.continue(),
  );
  await dialog
    .getByRole("button", { name: "Create task", exact: true })
    .click();
  await expect(dialog.getByText("Save failed. Try again.")).toBeVisible();
  await expect(dialog.getByLabel("Title", { exact: true })).toHaveValue(
    sample.title,
  );
  await page.unroute("**/api/tasks");
  await dialog
    .getByRole("button", { name: "Create task", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
});

test("mobile supports details/forms and dark mode persists without task storage", async ({
  page,
  request,
}) => {
  await request.post(`${api}/tasks`, { data: sample });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByText(sample.description, { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: /dark mode|switch.*dark/i }).click();
  await page.reload();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("button", { name: /light mode|switch.*light/i }),
  ).toBeVisible();
  await page
    .getByRole("complementary")
    .getByRole("button", { name: "Close navigation" })
    .click();
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).every((key) => /theme/i.test(key)),
    ),
  ).toBe(true);
  await openCreate(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("dialog")).toContainText("Description");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("keyboard focus stays inside dialog and reduced motion layout remains usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await openCreate(page);
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page
        .getByRole("dialog")
        .evaluate((dialog) => dialog.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("deleting final task on last page clamps pagination; pending and failed delete preserve focus/data", async ({
  page,
  request,
}) => {
  for (let i = 0; i < 7; i++)
    await request.post(`${api}/tasks`, {
      data: { ...sample, title: `Delete boundary ${i}` },
    });
  await page.goto("/");
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByTestId("task-row")).toHaveCount(1);
  const id = await page.getByTestId("task-row").getAttribute("data-task-id");
  await page
    .getByTestId("task-row")
    .getByRole("button", { name: "Delete task" })
    .click();
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**/api/tasks/${id}`, async (route) => {
    if (route.request().method() !== "DELETE") return route.continue();
    await gate;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"message":"Delete temporarily unavailable"}',
    });
  });
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Delete task", exact: true })
    .click();
  await expect(
    dialog.getByRole("button", { name: "Deleting…" }),
  ).toBeDisabled();
  await page.keyboard.press("Tab");
  expect(
    await dialog.evaluate((node) => node.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  release();
  await expect(
    dialog.getByText("Delete temporarily unavailable"),
  ).toBeVisible();
  expect((await request.get(`${api}/tasks/${id}`)).status()).toBe(200);
  await page.unroute(`**/api/tasks/${id}`);
  await dialog
    .getByRole("button", { name: "Delete task", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("Page 1 of 1")).toBeVisible();
  await expect(page.getByTestId("task-row")).toHaveCount(6);
  await expect(
    page.getByRole("button", { name: "New task", exact: true }).first(),
  ).toBeFocused();
});

test("details failure retries and details-to-edit restores meaningful focus", async ({
  page,
  request,
}) => {
  const task = await (
    await request.post(`${api}/tasks`, { data: sample })
  ).json();
  await page.goto("/");
  await page.route(`**/api/tasks/${task.id}`, (route) =>
    route.request().method() === "GET"
      ? route.fulfill({
          status: 503,
          contentType: "application/json",
          body: '{"message":"Details unavailable"}',
        })
      : route.continue(),
  );
  await page.getByRole("button", { name: `View task ${sample.title}` }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Details unavailable")).toBeVisible();
  await page.unroute(`**/api/tasks/${task.id}`);
  await dialog.getByRole("button", { name: "Retry" }).click();
  await expect(dialog.getByText(task.id)).toBeVisible();
  await dialog.getByRole("button", { name: "Edit task", exact: true }).click();
  await expect(
    dialog.getByRole("heading", { name: "Edit task" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", {
      name: `View task ${sample.title}`,
      exact: true,
    }),
  ).toBeFocused();
});

test("initial slow load cannot hide existing tasks after create succeeds", async ({
  page,
  request,
}) => {
  await request.post(`${api}/tasks`, {
    data: { ...sample, title: "Existing server task" },
  });
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let saveStarted = false;
  await page.route("**/api/tasks", async (route) => {
    if (route.request().method() === "POST") {
      saveStarted = true;
      return route.continue();
    }
    if (saveStarted) return route.continue();
    const snapshot = await route.fetch();
    await gate;
    await route.fulfill({ response: snapshot });
  });
  await page.goto("/");
  await expect(
    page.getByRole("status", { name: "Loading tasks" }),
  ).toBeVisible();
  await openCreate(page);
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Title", { exact: true })
    .fill("New task during initial load");
  await dialog
    .getByLabel("Description", { exact: true })
    .fill("Both task records must stay visible.");
  await dialog
    .getByRole("button", { name: "Create task", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "View task Existing server task" }),
  ).toBeVisible();
  release();
  await expect(
    page.getByRole("button", {
      name: "View task New task during initial load",
    }),
  ).toBeVisible();
  await expect(page.getByTestId("task-row")).toHaveCount(2);
});

test("required row fields and navigation remain usable from small mobile to desktop", async ({
  page,
  request,
}) => {
  const task = await (
    await request.post(`${api}/tasks`, { data: sample })
  ).json();
  const createdLabel = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(task.createdAt));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const row = page.getByTestId("task-row");
    await expect(row.getByText(sample.description)).toBeVisible();
    await expect(
      row.locator(".created-date:visible, .task-created-inline:visible"),
    ).toContainText(createdLabel);
    await expect(
      row.getByRole("combobox", { name: `Status for ${sample.title}` }),
    ).toHaveValue("pending");
    await expect(row.getByText("High", { exact: true })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width <= 850)
      await expect(page.getByRole("complementary")).not.toBeVisible();
    else
      await expect(
        page.getByRole("button", { name: "Open navigation" }),
      ).not.toBeVisible();
  }
});

test("unknown pages offer recovery and privacy/terms links open real pages", async ({
  page,
}) => {
  const taskRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/tasks")) taskRequests.push(request.url());
  });
  await page.goto("/page-that-does-not-exist");
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  expect(taskRequests).toHaveLength(0);
  await page.getByRole("link", { name: "Privacy", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Privacy notice" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Terms of use", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Terms of use" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to tasks", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Operations tasks" }),
  ).toBeVisible();
});

test("task workspace uses restrained borders and solid surfaces", async ({
  page,
  request,
}) => {
  await request.post(`${api}/tasks`, { data: sample });
  await page.goto("/");
  await expect(page.getByTestId("task-row")).toHaveCount(1);
  const styles = await page.locator(".tasks-panel").evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      background: style.backgroundColor,
      shadow: style.boxShadow,
      radius: parseFloat(style.borderRadius),
      image: style.backgroundImage,
    };
  });
  expect(styles.shadow).toBe("none");
  expect(styles.image).toBe("none");
  expect(styles.radius).toBeLessThanOrEqual(4);
  expect(styles.background).not.toBe("rgb(255, 255, 255)");
  await expect(page.locator(".metric")).toHaveCount(4);
  await expect(
    page.getByRole("progressbar", { name: "Task completion" }),
  ).toBeVisible();
});

test("inline status changes preserve fields, support retry, and update metric filters", async ({
  page,
  request,
}) => {
  const created = await (
    await request.post(`${api}/tasks`, { data: sample })
  ).json();
  await page.goto("/");
  const row = page.getByTestId("task-row");
  const status = row.getByRole("combobox", {
    name: `Status for ${sample.title}`,
  });
  let releaseStatus: () => void = () => {};
  const statusGate = new Promise<void>((resolve) => {
    releaseStatus = resolve;
  });
  await page.route(`**/api/tasks/${created.id}`, async (route) => {
    if (route.request().method() === "PUT") {
      await statusGate;
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: '{"message":"Status save unavailable"}',
      });
    }
    return route.continue();
  });
  await status.selectOption("in_progress");
  await expect(status).toBeDisabled();
  await expect(row.getByRole("button", { name: "Edit task" })).toBeDisabled();
  await expect(row.getByRole("button", { name: "Delete task" })).toBeDisabled();
  await expect(
    row.getByRole("button", { name: `View task ${sample.title}` }),
  ).toBeDisabled();
  releaseStatus();
  await expect(row.getByRole("alert")).toHaveText("Status save unavailable");
  await expect(status).toHaveValue("pending");
  await expect(status).toBeFocused();
  await page.unroute(`**/api/tasks/${created.id}`);
  await status.selectOption("in_progress");
  await expect(status).toHaveValue("in_progress");
  await expect(status).toBeFocused();
  const saved = await (await request.get(`${api}/tasks/${created.id}`)).json();
  expect(saved).toMatchObject({
    ...sample,
    status: "in_progress",
    createdAt: created.createdAt,
  });
  await page
    .getByRole("region", { name: "Task overview" })
    .getByRole("button", { name: "In progress 1", exact: true })
    .click();
  await status.focus();
  await status.selectOption("completed");
  await expect(page.getByTestId("task-row")).toHaveCount(0);
  await expect(page.getByLabel("Status filter")).toBeFocused();
  const completed = page
    .getByRole("region", { name: "Task overview" })
    .getByRole("button", { name: "Completed 1", exact: true });
  await completed.click();
  await expect(page.getByTestId("task-row")).toHaveCount(1);
  await expect(status).toHaveValue("completed");
  await page.setViewportSize({ width: 390, height: 844 });
  await status.focus();
  await status.selectOption("pending");
  await expect(page.getByTestId("task-row")).toHaveCount(0);
  expect(
    (await (await request.get(`${api}/tasks/${created.id}`)).json()).status,
  ).toBe("pending");
});

test("dashboard metrics reset pagination even when selecting current status", async ({
  page,
  request,
}) => {
  for (let i = 0; i < 8; i++)
    await request.post(`${api}/tasks`, {
      data: { ...sample, title: `Metric page task ${i}` },
    });
  await page.goto("/");
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
  const all = page
    .getByRole("region", { name: "Task overview" })
    .getByRole("button", { name: "All tasks 8", exact: true });
  await all.click();
  await expect(page.getByText("Page 1 of 2")).toBeVisible();
  await expect(all).toHaveAttribute("aria-pressed", "true");
  await expect(
    page
      .getByRole("complementary")
      .getByRole("button", { name: /All tasks|In progress|Completed/ }),
  ).toHaveCount(0);
});

test("overdue queue finds unfinished work, resets filters and pages, and removes completed tasks through the real API", async ({
  page,
  request,
}) => {
  for (let index = 0; index < 8; index++) {
    const response = await request.post(`${api}/tasks`, {
      data: {
        ...sample,
        title: `Overdue operations ${index}`,
        status: index % 2 ? "in_progress" : "pending",
        dueDate: "2000-01-01",
      },
    });
    expect(response.status()).toBe(201);
  }
  for (const data of [
    {
      title: "Completed past-due task",
      status: "completed",
      dueDate: "2000-01-01",
    },
    { title: "Future task", status: "pending", dueDate: "9999-01-01" },
    { title: "Undated task", status: "pending", dueDate: null },
  ]) {
    expect(
      (
        await request.post(`${api}/tasks`, { data: { ...sample, ...data } })
      ).status(),
    ).toBe(201);
  }
  await page.goto("/");
  const overdue = page.getByRole("button", { name: "Overdue 8", exact: true });
  await expect(overdue).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Search tasks" })
    .fill("missing-task");
  await page.getByLabel("Priority filter").selectOption("low");
  await expect(page.getByText("No tasks match your filters")).toBeVisible();
  await overdue.click();
  await expect(overdue).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("searchbox")).toHaveValue("");
  await expect(page.getByLabel("Priority filter")).toHaveValue("all");
  await expect(page.getByLabel("Status filter")).toHaveValue("overdue");
  await expect(page.getByTestId("task-row")).toHaveCount(6);
  for (const title of [
    "Completed past-due task",
    "Future task",
    "Undated task",
  ])
    await expect(
      page.getByRole("button", { name: `View task ${title}`, exact: true }),
    ).toHaveCount(0);
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
  await expect(page.getByTestId("task-row")).toHaveCount(2);
  await overdue.click();
  await expect(page.getByText("Page 1 of 2")).toBeVisible();
  const row = page.getByTestId("task-row").first();
  const id = await row.getAttribute("data-task-id");
  const original = await (await request.get(`${api}/tasks/${id}`)).json();
  const status = row.getByRole("combobox", {
    name: `Status for ${original.title}`,
    exact: true,
  });
  expect(
    await status
      .locator("option")
      .evaluateAll((options) =>
        options.map((option) => (option as HTMLOptionElement).value),
      ),
  ).toEqual(["pending", "in_progress", "completed"]);
  await status.focus();
  await status.selectOption("completed");
  await expect(
    page.getByRole("button", {
      name: `View task ${original.title}`,
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Overdue 7", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Completed 2", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Status filter")).toBeFocused();
  const updated = await (await request.get(`${api}/tasks/${id}`)).json();
  expect(updated).toMatchObject({
    id: original.id,
    title: original.title,
    description: original.description,
    priority: original.priority,
    dueDate: original.dueDate,
    createdAt: original.createdAt,
    status: "completed",
  });
  const invalidStatus = await request.put(`${api}/tasks/${id}`, {
    data: { ...sample, status: "overdue" },
  });
  expect(invalidStatus.status()).toBe(400);
  expect(await (await request.get(`${api}/tasks/${id}`)).json()).toEqual(
    updated,
  );
  await page.getByRole("button", { name: "All tasks 11", exact: true }).click();
  await page.getByLabel("Status filter").selectOption("overdue");
  await expect(
    page.getByRole("button", { name: "Overdue 7", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  for (const task of await (await request.get(`${api}/tasks`)).json())
    expect(["pending", "in_progress", "completed"]).toContain(task.status);
});

test("mobile navigation contains keyboard focus and returns it after every close path", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const opener = page.getByRole("button", { name: "Open navigation" });
  await opener.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("complementary");
  await expect(
    menu.getByRole("button", { name: "Close navigation" }),
  ).toBeFocused();
  for (let index = 0; index < 10; index++) {
    await page.keyboard.press("Tab");
    expect(
      await menu.evaluate((node) => node.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.keyboard.press("/");
  expect(
    await menu.evaluate((node) => node.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await menu.getByRole("button", { name: "Close navigation" }).click();
  await expect(opener).toBeFocused();
  await opener.click();
  await page.locator(".nav-backdrop").click({ position: { x: 370, y: 500 } });
  await expect(menu).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(opener).not.toBeVisible();
  await expect(page.locator(".main-shell")).not.toHaveAttribute("inert");
  await expect(
    page.getByRole("button", { name: "New task", exact: true }).first(),
  ).toBeEnabled();
});

test("remaining controls support cancel, close, clear, shortcuts, details-delete and API docs", async ({
  page,
  request,
  context,
}) => {
  const task = await (
    await request.post(`${api}/tasks`, { data: sample })
  ).json();
  await page.goto("/");
  await openCreate(page);
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await openCreate(page);
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await expect(dialog).not.toBeVisible();
  await openCreate(page);
  await page.locator(".overlay").click({ position: { x: 10, y: 10 } });
  await expect(dialog).not.toBeVisible();
  await page.keyboard.press("/");
  await expect(
    page.getByRole("searchbox", { name: "Search tasks" }),
  ).toBeFocused();
  await page.getByRole("searchbox").fill("does-not-match-any-task");
  await expect(
    page.getByRole("button", { name: "Clear filters" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByTestId("task-row")).toHaveCount(1);
  await page.getByLabel("Sort tasks").selectOption("created-asc");
  await page.getByLabel("Sort tasks").selectOption("due-desc");
  const docsPagePromise = context.waitForEvent("page");
  await page.getByRole("link", { name: "API documentation" }).click();
  const docsPage = await docsPagePromise;
  await expect(
    docsPage.getByRole("heading", { name: /Task.*API/ }),
  ).toBeVisible();
  await docsPage
    .getByRole("button", { name: "GET /api/tasks List all tasks", exact: true })
    .click();
  await docsPage
    .getByRole("button", { name: "Try it out", exact: true })
    .click();
  const docsResponse = docsPage.waitForResponse(
    (response) =>
      response.url().endsWith("/api/tasks") &&
      response.request().method() === "GET",
  );
  await docsPage.getByRole("button", { name: "Execute", exact: true }).click();
  expect((await docsResponse).status()).toBe(200);
  await docsPage.close();
  await page.getByRole("button", { name: `View task ${sample.title}` }).click();
  await dialog
    .getByRole("button", { name: "Delete task", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Keep task", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect((await request.get(`${api}/tasks/${task.id}`)).status()).toBe(200);
  await page.getByRole("button", { name: `View task ${sample.title}` }).click();
  await dialog
    .getByRole("button", { name: "Delete task", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Delete task", exact: true })
    .click();
  await expect(page.getByText("Task deleted.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(
    page.getByText("Task deleted.", { exact: true }),
  ).not.toBeVisible();
  await page
    .getByRole("region", { name: "Tasks", exact: true })
    .getByRole("button", { name: "New task" })
    .click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  expect((await request.get(`${api}/tasks/${task.id}`)).status()).toBe(404);
  await page.reload();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to tasks" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});

test("invalid successful API responses stay recoverable in list, details and forms", async ({
  page,
  request,
}) => {
  await page.route("**/api/tasks", (route) =>
    route.request().method() === "GET"
      ? route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "null",
        })
      : route.continue(),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Tasks could not be loaded" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Something went wrong" }),
  ).not.toBeVisible();
  await page.unroute("**/api/tasks");
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(
    page.getByRole("heading", { name: "No tasks yet" }),
  ).toBeVisible();
  await openCreate(page);
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title", { exact: true }).fill(sample.title);
  await dialog
    .getByLabel("Description", { exact: true })
    .fill(sample.description);
  await page.route("**/api/tasks", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 201,
          contentType: "application/json",
          body: '{"id":"incomplete"}',
        })
      : route.continue(),
  );
  await dialog
    .getByRole("button", { name: "Create task", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("invalid response");
  await expect(dialog.getByLabel("Title", { exact: true })).toHaveValue(
    sample.title,
  );
  await page.unroute("**/api/tasks");
  await dialog
    .getByRole("button", { name: "Create task", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  const task = (await (await request.get(`${api}/tasks`)).json())[0];
  await page.route(`**/api/tasks/${task.id}`, (route) =>
    route.request().method() === "GET"
      ? route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "{}",
        })
      : route.continue(),
  );
  await page.getByRole("button", { name: `View task ${sample.title}` }).click();
  await expect(dialog.getByRole("alert")).toContainText("invalid response");
  await page.unroute(`**/api/tasks/${task.id}`);
  await dialog.getByRole("button", { name: "Retry" }).click();
  await expect(dialog.getByText(task.id, { exact: true })).toBeVisible();
});

test("render failure recovery buttons retry safely and reload the healthy workspace", async ({
  page,
}) => {
  const appModule = "**/src/App.tsx*";
  await page.route(appModule, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: 'export default function App() { throw new Error("Controlled render failure"); }',
    }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Something went wrong" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Something went wrong" }),
  ).toBeVisible();
  await expect(
    page.getByText("Controlled render failure", { exact: true }),
  ).not.toBeVisible();
  await page.unroute(appModule);
  await page.getByRole("button", { name: "Reload page", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Operations tasks" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Something went wrong" }),
  ).not.toBeVisible();
});
