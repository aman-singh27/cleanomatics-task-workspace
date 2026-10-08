import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.js"],
      exclude: ["src/server.js"],
      reporter: ["text", "json-summary", "html"],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
});
