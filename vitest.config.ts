import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/*"],
    coverage: {
      thresholds: {
        autoUpdate: (newThreshold: number) => Math.floor(newThreshold),
        statements: 63,
        branches: 43,
        functions: 64,
        lines: 72,
      },
    },
  },
});
