import react from "@vitejs/plugin-react";
import * as fs from "fs";
import { defineConfig, loadEnv, PluginOption, ServerOptions } from "vite";

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
    plugins: [htmlPlugin(), react()],
  };
});
