/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv, type PluginOption } from "vite";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Construct the URL for the express server used by the Vite dev server
  const expressServerUrl = (() => {
    const httpPort = env.PROXY_SERVER_HTTP_PORT || 80;
    const port = httpPort !== 80 ? `:${httpPort}` : "";
    const baseUrl = `http://localhost${port}`;
    return baseUrl;
  })();

  const htmlPlugin = (): PluginOption => {
    return {
      name: "html-transform",
      transformIndexHtml: {
        order: "pre",
        handler: (html: string) => {
          return html.replace(/%(.*?)%/g, function (_match, p1) {
            return env[p1] ? env[p1] : "";
          });
        },
      },
    };
  };

  return {
    server: {
      host: true,
      watch: {
        ignored: ["**/*.test.ts", "**/*.test.tsx"],
      },
      proxy: {
        // Forward these requests to the express server when in dev mode
        "/defaultConnection": {
          target: expressServerUrl,
          changeOrigin: true,
        },
        "/status": {
          target: expressServerUrl,
          changeOrigin: true,
        },
      },
    },
    base: env.GRAPH_EXP_ENV_ROOT_FOLDER,
    envPrefix: "GRAPH_EXP",
    define: {
      __GRAPH_EXP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    plugins: [
      tsconfigPaths(),
      htmlPlugin(),
      tailwindcss(),
      react({
        babel: {
          plugins: [
            [
              "babel-plugin-react-compiler",
              {
                target: "19", // '17' | '18' | '19'
              },
            ],
          ],
        },
      }),
    ],
    test: {
      environment: "happy-dom",
      globals: true,
      setupFiles: ["src/setupTests.ts"],
      coverage: {
        reportsDirectory: "coverage",
        provider: "v8",
        reporter: ["lcov", "text", "json", "clover"],
        exclude: [
          "src/components/icons",
          "src/@types",
          "src/index.tsx",
          "src/App.ts",
          "src/setupTests.ts",
          "src/**/*.style.ts",
          "src/**/*.styles.ts",
          "src/**/*.styles.css.ts",
          "tailwind.config.ts",
          ...coverageConfigDefaults.exclude,
        ],
      },
    },
  };
});
