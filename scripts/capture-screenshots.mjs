import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const baseURL = process.env.PREVIEW_URL || "http://127.0.0.1:5175";
const directory = "output/playwright";
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(baseURL);
  await page.getByTestId("task-row").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `${directory}/desktop-light.png`,
    fullPage: true,
  });
  await page
    .getByTestId("task-row")
    .first()
    .getByRole("button", { name: /^View task / })
    .click();
  await page
    .getByRole("dialog")
    .getByText("Task ID", { exact: true })
    .waitFor();
  await page.screenshot({
    path: `${directory}/task-details.png`,
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.screenshot({
    path: `${directory}/desktop-dark.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: `${directory}/mobile-light.png`,
    fullPage: true,
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page
    .getByRole("complementary")
    .getByRole("button", { name: "Close navigation" })
    .click();
  await page.screenshot({
    path: `${directory}/mobile-dark.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "New task", exact: true })
    .first()
    .click();
  await page.screenshot({
    path: `${directory}/mobile-form.png`,
    fullPage: true,
  });
  console.log(
    JSON.stringify({
      baseURL,
      directory,
      mobileOverflow: overflow,
      pageErrors: errors,
    }),
  );
  if (overflow || errors.length) process.exitCode = 1;
} finally {
  await browser.close();
}
