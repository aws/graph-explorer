import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    setupFiles: ["src/test-setup.ts"],
    coverage: {
      reportsDirectory: "coverage",
      provider: "v8",
      reporter: ["lcov", "text", "json", "clover"],
    },
  },
});
