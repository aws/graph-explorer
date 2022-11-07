import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import EnvironmentPlugin from "vite-plugin-environment";

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

  return {
    server: {
      host: true
    },
    base: env.REACT_APP_ENV_ROOT_FOLDER,
    envPrefix: "REACT_APP",
    plugins: [
      htmlPlugin(),
      EnvironmentPlugin("all", { prefix: "REACT_APP_" }),
      react(),
    ],
  };
});
