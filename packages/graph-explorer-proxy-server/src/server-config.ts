import { STATIC_MOUNT_PATH } from "@graph-explorer/shared/constants";
import fs from "fs";
import path from "path";

import type { EnvironmentValues } from "./env.ts";
import type { AppLogger } from "./logging.ts";

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

  const { port, portWarnings } = resolvePort(env, useHttps);

  return {
    host: env.HOST,
    port,
    portWarnings,
    useHttps,
    baseUrl: buildBaseUrl(useHttps, env.HOST, port),
    certificateKeyFilePath,
    certificateFilePath,
    staticFilesVirtualPath: STATIC_MOUNT_PATH,
    staticFilesPath: path.join(clientRoot, "dist"),
  };
}

type Scheme = "http" | "https";

type DeprecatedPortVariable =
  | "PROXY_SERVER_HTTP_PORT"
  | "PROXY_SERVER_HTTPS_PORT";

type ListenerPorts = {
  defaultPort: number;
  /** The deprecated variable that sets this listener's port. */
  portVariable: DeprecatedPortVariable;
  /** The deprecated variable for the other listener, which has no effect. */
  otherPortVariable: DeprecatedPortVariable;
};

const listenerPorts = {
  http: {
    defaultPort: 80,
    portVariable: "PROXY_SERVER_HTTP_PORT",
    otherPortVariable: "PROXY_SERVER_HTTPS_PORT",
  },
  https: {
    defaultPort: 443,
    portVariable: "PROXY_SERVER_HTTPS_PORT",
    otherPortVariable: "PROXY_SERVER_HTTP_PORT",
  },
} as const satisfies Record<Scheme, ListenerPorts>;

function schemeFor(useHttps: boolean): Scheme {
  return useHttps ? "https" : "http";
}

/**
 * Picks the listener's port, preferring PROXY_SERVER_PORT over the deprecated
 * per-protocol variables, with a warning for each deprecated one that is set.
 */
function resolvePort(env: EnvironmentValues, useHttps: boolean) {
  const { defaultPort, portVariable, otherPortVariable } =
    listenerPorts[schemeFor(useHttps)];
  const portWarnings: string[] = [];

  const deprecatedPort = env[portVariable];
  if (deprecatedPort !== undefined) {
    portWarnings.push(
      env.PROXY_SERVER_PORT === undefined
        ? `${portVariable} is deprecated. Use PROXY_SERVER_PORT instead.`
        : `${portVariable} (${deprecatedPort}) is ignored because PROXY_SERVER_PORT (${env.PROXY_SERVER_PORT}) is set. ${portVariable} is deprecated, remove it.`,
    );
  }
  if (env[otherPortVariable] !== undefined) {
    portWarnings.push(
      `${otherPortVariable} has no effect while HTTPS is ${useHttps ? "on" : "off"}. Remove it.`,
    );
  }

  const port = env.PROXY_SERVER_PORT ?? deprecatedPort ?? defaultPort;
  return { port, portWarnings };
}

export function logPortWarnings(
  portWarnings: string[],
  logger: Pick<AppLogger, "warn">,
) {
  for (const warning of portWarnings) {
    logger.warn(warning);
  }
}

export function buildBaseUrl(useHttps: boolean, host: string, port: number) {
  const scheme = schemeFor(useHttps);
  const portSuffix =
    port === listenerPorts[scheme].defaultPort ? "" : `:${port}`;
  return `${scheme}://${host}${portSuffix}`;
}
