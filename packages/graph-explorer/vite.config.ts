/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import * as fs from "fs";
import { loadEnv, PluginOption, ServerOptions } from "vite";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const htmlPlugin = (): PluginOption => {
    return {
      name: "html-transform",
      transformIndexHtml: {
        order: "pre",
        handler: (html: string) => {
          return html.replace(/%(.*?)%/g, function (match, p1) {
            return env[p1] ? env[p1] : "";
          });
        },
      },
    };
  };

  const serverInfo = (): ServerOptions => {
    if (
      env.GRAPH_EXP_HTTPS_CONNECTION != "false" &&
      fs.existsSync("../graph-explorer-proxy-server/cert-info/server.key") &&
      fs.existsSync("../graph-explorer-proxy-server/cert-info/server.crt")
    ) {
      return {
        host: true,
        https: {
          key: fs.readFileSync(
            "../graph-explorer-proxy-server/cert-info/server.key"
          ),
          cert: fs.readFileSync(
            "../graph-explorer-proxy-server/cert-info/server.crt"
          ),
        },
      };
    } else {
      return {
        host: true,
      };
    }
  };

  return {
    server: serverInfo(),
    base: env.GRAPH_EXP_ENV_ROOT_FOLDER,
    envPrefix: "GRAPH_EXP",
    define: {
      __GRAPH_EXP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    plugins: [tsconfigPaths(), htmlPlugin(), react()],
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
          ...coverageConfigDefaults.exclude,
        ],
      },
    },
  };
});
