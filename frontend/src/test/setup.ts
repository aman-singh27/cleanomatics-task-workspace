import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";
expect.extend(matchers);
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
afterEach(() => {
  cleanup();
  localStorage.clear();
});
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }),
});
