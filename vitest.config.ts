import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/*"],
    coverage: {
      thresholds: {
        autoUpdate: (newThreshold: number) => Math.floor(newThreshold),
        statements: 64,
        branches: 43,
        functions: 57,
        lines: 71,
      },
    },
  },
});
