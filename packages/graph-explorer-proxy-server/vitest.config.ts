import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      reportsDirectory: "coverage",
      provider: "v8",
      reporter: ["lcov", "text", "json", "clover"],
    },
  },
});
