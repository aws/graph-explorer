import type { ConfigJson } from "./config-json.ts";

/** The connection the proxy server serves at `/defaultConnection`. */
export type DefaultConnection = {
  GRAPH_EXP_CONNECTION_URL: string;
  GRAPH_EXP_GRAPH_TYPE?: string;
  GRAPH_EXP_SERVICE_TYPE?: string;
  GRAPH_EXP_IAM?: boolean;
  GRAPH_EXP_AWS_REGION?: string;
  GRAPH_EXP_USING_PROXY_SERVER: boolean;
};

/**
 * Resolves the Default Connection from the connection settings, or
 * `undefined` when they name no URL.
 *
 * A connection is proxied when USING_PROXY_SERVER is true, or when it is unset
 * and only GRAPH_CONNECTION_URL is set. Earlier versions treated an unset
 * USING_PROXY_SERVER as false, so an unset value with PUBLIC_OR_PROXY_ENDPOINT
 * stays direct. Like transformLegacyConnection() in configuration.ts, a direct
 * connection drops IAM, region, and service type because the browser sends its
 * requests and nothing would sign them.
 */
export function resolveDefaultConnection(settings: ConfigJson["values"]): {
  defaultConnection: DefaultConnection | undefined;
  warnings: string[];
} {
  const warnings: string[] = [];
  const endpoint = settings.PUBLIC_OR_PROXY_ENDPOINT ?? "";
  const connectionUrl = settings.GRAPH_CONNECTION_URL ?? "";
  const usingProxyServer = settings.USING_PROXY_SERVER ?? "";

  const isProxied =
    usingProxyServer.toLowerCase() === "true" ||
    (usingProxyServer === "" && connectionUrl !== "" && endpoint === "");
  const url = isProxied ? connectionUrl : endpoint || connectionUrl;
  if (url === "") {
    return { defaultConnection: undefined, warnings };
  }

  const graphType =
    settings.GRAPH_TYPE ||
    (settings.SERVICE_TYPE === "neptune-graph" ? "openCypher" : undefined);

  const defaultConnection: DefaultConnection = {
    GRAPH_EXP_CONNECTION_URL: url,
    ...(graphType && { GRAPH_EXP_GRAPH_TYPE: graphType }),
    ...(isProxied && {
      GRAPH_EXP_SERVICE_TYPE: settings.SERVICE_TYPE || "neptune-db",
      GRAPH_EXP_IAM: readIam(settings.IAM, warnings),
      GRAPH_EXP_AWS_REGION: settings.AWS_REGION ?? "",
    }),
    GRAPH_EXP_USING_PROXY_SERVER: isProxied,
  };
  return { defaultConnection, warnings };
}

function readIam(value: string | undefined, warnings: string[]) {
  if (!value || /^false$/i.test(value)) {
    return false;
  }
  if (/^true$/i.test(value)) {
    return true;
  }
  warnings.push(
    `IAM is "${value}", which isn't true or false, so the Default Connection uses false.`,
  );
  return false;
}
