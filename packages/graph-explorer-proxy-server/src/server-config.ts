import fs from "fs";
import path from "path";

import type { EnvironmentValues } from "./env.ts";

import { clientRoot, proxyServerRoot } from "./paths.ts";

export class ServerConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServerConfigError";
  }
}

export function resolveServerConfig(env: EnvironmentValues) {
  const certificateKeyFilePath = path.join(
    proxyServerRoot,
    "cert-info/server.key",
  );
  const certificateFilePath = path.join(
    proxyServerRoot,
    "cert-info/server.crt",
  );

  const useHttps = env.PROXY_SERVER_HTTPS_CONNECTION;

  if (useHttps) {
    const missingFiles = [certificateKeyFilePath, certificateFilePath].filter(
      f => !fs.existsSync(f),
    );
    if (missingFiles.length > 0) {
      throw new ServerConfigError(
        `PROXY_SERVER_HTTPS_CONNECTION is true but certificate files are missing: ${missingFiles.join(", ")}`,
      );
    }
  }

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
