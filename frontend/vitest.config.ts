import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Vitest is the project's test runner. `jsdom` gives tests a browser-like
// `window`/`localStorage`; `globals: true` exposes describe/it/expect without
// importing them in every file (Jest-style), so existing tests keep working.
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
