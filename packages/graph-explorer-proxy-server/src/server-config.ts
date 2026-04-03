import fs from "fs";
import path from "path";

import type { EnvironmentValues } from "./env.js";

import { clientRoot, proxyServerRoot } from "./paths.js";

export function resolveServerConfig(env: EnvironmentValues) {
  const certificateKeyFilePath = path.join(
    proxyServerRoot,
    "cert-info/server.key",
  );
  const certificateFilePath = path.join(
    proxyServerRoot,
    "cert-info/server.crt",
  );

  const useHttps =
    env.PROXY_SERVER_HTTPS_CONNECTION &&
    fs.existsSync(certificateKeyFilePath) &&
    fs.existsSync(certificateFilePath);

  const port = useHttps
    ? env.PROXY_SERVER_HTTPS_PORT
    : env.PROXY_SERVER_HTTP_PORT;

  return {
    host: env.HOST,
    port,
    useHttps,
    baseUrl: buildBaseUrl(useHttps, env.HOST, port),
    certificateKeyFilePath,
    certificateFilePath,
    staticFilesVirtualPath: "/explorer",
    staticFilesPath: path.join(clientRoot, "dist"),
  };
}

export function buildBaseUrl(useHttps: boolean, host: string, port: number) {
  const scheme = useHttps ? "https" : "http";
  const defaultPort = useHttps ? 443 : 80;
  const portSuffix = port === defaultPort ? "" : `:${port}`;
  return `${scheme}://${host}${portSuffix}`;
}
