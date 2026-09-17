import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/*"],
    coverage: {
      thresholds: {
        autoUpdate: (newThreshold: number) => Math.floor(newThreshold),
        statements: 66,
        branches: 47,
        functions: 59,
        lines: 74,
      },
    },
  },
});
