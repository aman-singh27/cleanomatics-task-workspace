import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5174",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm run start --workspace backend",
      url: "http://127.0.0.1:4001/api/health",
      reuseExistingServer: false,
      env: {
        PORT: "4001",
        SEED_DEMO_DATA: "false",
        CORS_ORIGINS: "http://127.0.0.1:5174",
      },
    },
    {
      command: "npm run dev --workspace frontend -- --port 5174",
      url: "http://127.0.0.1:5174",
      reuseExistingServer: false,
      env: { API_PROXY_TARGET: "http://127.0.0.1:4001" },
    },
  ],
});
