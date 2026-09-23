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

  // The notebook preset serves over HTTP and never generates certificates, so
  // this pair can never start. Refusing here names the real cause, where
  // falling through would blame the missing certificates instead. Refusing
  // rather than forcing HTTP off keeps an explicit TLS request from being
  // silently discarded.
  if (env.NEPTUNE_NOTEBOOK && useHttps) {
    throw new ServerConfigError(
      "NEPTUNE_NOTEBOOK and PROXY_SERVER_HTTPS_CONNECTION are both true. " +
        "The Neptune Notebook preset serves Graph Explorer over HTTP and does " +
        "not generate TLS certificates, so this combination cannot start. " +
        "Either drop PROXY_SERVER_HTTPS_CONNECTION to run under the notebook " +
        "preset, or set NEPTUNE_NOTEBOOK to false to run with TLS.",
    );
  }

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
