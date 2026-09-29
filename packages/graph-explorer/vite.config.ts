import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins, loadEnv } from "vite-plus";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Construct the URL for the express server used by the Vite dev server
  const expressServerUrl = (() => {
    const httpPort = env.PROXY_SERVER_HTTP_PORT || 80;
    const port = httpPort !== 80 ? `:${httpPort}` : "";
    const baseUrl = `http://localhost${port}`;
    return baseUrl;
  })();

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
    plugins: lazyPlugins(() => [
      tailwindcss(),
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
