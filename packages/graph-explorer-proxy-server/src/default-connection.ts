import type { ConfigJson } from "./config-json.ts";

/**
 * Renders the Default Connection from the connection settings, as the text
 * process-environment.sh wrote to `defaultConnection.json`, or returns
 * `undefined` when they name no URL. Each value is written as it is, so an
 * IAM value that isn't a JSON literal, such as `True`, makes text that isn't
 * valid JSON, as before.
 *
 * A connection is proxied when USING_PROXY_SERVER is true, or when it is unset
 * and only GRAPH_CONNECTION_URL is set. Earlier versions treated an unset
 * USING_PROXY_SERVER as false, so an unset value with PUBLIC_OR_PROXY_ENDPOINT
 * stays direct. Like transformLegacyConnection() in configuration.ts, a direct
 * connection drops IAM, region, and service type because the browser sends its
 * requests and nothing would sign them.
 */
export function renderDefaultConnection(
  settings: ConfigJson["values"],
): string | undefined {
  const endpoint = settings.PUBLIC_OR_PROXY_ENDPOINT ?? "";
  const connectionUrl = settings.GRAPH_CONNECTION_URL ?? "";
  const usingProxyServer = settings.USING_PROXY_SERVER ?? "";

  const isProxied =
    usingProxyServer.toLowerCase() === "true" ||
    (usingProxyServer === "" && connectionUrl !== "" && endpoint === "");
  const url = isProxied ? connectionUrl : endpoint || connectionUrl;
  if (url === "") {
    return undefined;
  }

  const graphType =
    settings.GRAPH_TYPE ||
    (settings.SERVICE_TYPE === "neptune-graph" ? "openCypher" : undefined);

  const lines = ["", "{", `"GRAPH_EXP_CONNECTION_URL":"${url}",`];
  if (graphType) {
    lines.push(`"GRAPH_EXP_GRAPH_TYPE":"${graphType}",`);
  }
  if (isProxied) {
    lines.push(
      `"GRAPH_EXP_SERVICE_TYPE":"${settings.SERVICE_TYPE || "neptune-db"}",`,
      `"GRAPH_EXP_IAM":${settings.IAM || "false"},`,
      `"GRAPH_EXP_AWS_REGION":"${settings.AWS_REGION ?? ""}",`,
    );
  }
  lines.push(`"GRAPH_EXP_USING_PROXY_SERVER":${isProxied}`, "}");
  return lines.map(line => `${line}\n`).join("");
}
