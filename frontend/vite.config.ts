import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target:
          process.env.API_PROXY_TARGET ||
          loadEnv(mode, process.cwd(), "API_PROXY_TARGET").API_PROXY_TARGET ||
          "http://127.0.0.1:4000",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx", "src/test/**", "src/**/*.test.*"],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
}));
