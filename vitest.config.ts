import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/*"],
    coverage: {
      thresholds: {
        autoUpdate: (newThreshold: number) => Math.floor(newThreshold),
<<<<<<< HEAD
        statements: 64,
        branches: 44,
=======
        statements: 65,
        branches: 45,
>>>>>>> c9fa43c6 (feat(settings): add styling import / export / reset UI)
        functions: 58,
        lines: 72,
      },
    },
  },
});
