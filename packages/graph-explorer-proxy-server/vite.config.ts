import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    environment: "node",
    pool: "threads",
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    setupFiles: ["src/test-setup.ts"],
  },
});
