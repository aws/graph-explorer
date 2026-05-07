import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/*"],
    coverage: {
      thresholds: {
        autoUpdate: (newThreshold: number) => Math.floor(newThreshold),
        statements: 64,
        branches: 44,
        functions: 58,
        lines: 72,
      },
    },
  },
});
