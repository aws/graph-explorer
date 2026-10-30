import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins, loadEnv } from "vite-plus";

import { browserslistBuildTarget } from "./buildTarget.ts";
import { proxyServerUrl } from "./proxyServerUrl.ts";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const expressServerUrl = proxyServerUrl(env);

  return {
    server: {
      host: true,
      port: Number(env.GRAPH_EXP_DEV_PORT) || undefined,
      strictPort: !!env.GRAPH_EXP_DEV_PORT,
      watch: {
        ignored: ["**/*.test.ts", "**/*.test.tsx"],
      },
      proxy: {
        // Forward API requests to the Express proxy server in dev mode so
        // the browser stays on the same origin and CORS is not needed.
        "^/(defaultConnection|gremlin|logger|openCypher|pg|rdf|sparql|status|summary)(/|$)":
          {
            target: expressServerUrl,
            changeOrigin: true,
          },
      },
    },
    base: "./",
    envPrefix: "GRAPH_EXP",
    define: {
      __GRAPH_EXP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    build: {
      target: browserslistBuildTarget(),
    },
    plugins: lazyPlugins(() => [
      // Tailwind's own Lightning CSS pass has fixed browser targets. Vite's CSS
      // minify compiles for build.cssTarget, which follows .browserslistrc.
      tailwindcss({ optimize: false }),
      react(),
      babel({
        presets: [reactCompilerPreset()],
      }),
    ]),
    resolve: {
      tsconfigPaths: true,
    },
    test: {
      pool: "threads",

      // Setup
      globalSetup: ["src/globalSetup.ts"],
      setupFiles: ["src/setupTests.ts"],

      // Reset state between tests
      clearMocks: true,
      resetMocks: true,
      restoreMocks: true,
      unstubEnvs: true,
      unstubGlobals: true,
    },
  };
});
