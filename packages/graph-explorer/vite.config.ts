import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import fs from "fs";

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const htmlPlugin = () => {
    return {
      name: "html-transform",
      transformIndexHtml: {
        enforce: "pre",
        transform: (html: string) => {
          return html.replace(/%(.*?)%/g, function (match, p1) {
            return env[p1] ? env[p1] : "";
          });
        },
      },
    } as any;
  };

  const httpsPlugin = () => {
    if (env.GRAPH_EXP_HTTPS_CONNECTION) {
      return {
        key: fs.readFileSync("../graph-explorer-proxy-server/cert-info/server.key"),
        cert: fs.readFileSync("../graph-explorer-proxy-server/cert-info/server.crt"),
      } as any;
    } else {
      return {} as any;
    }
  }

  return {
    server: {
      host: true,
      https: httpsPlugin(),
    },
    base: env.GRAPH_EXP_ENV_ROOT_FOLDER,
    envPrefix: "GRAPH_EXP",
    plugins: [htmlPlugin(), react()],
  };
});
