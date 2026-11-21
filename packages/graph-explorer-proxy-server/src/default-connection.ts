import type { DefaultConnectionDataSchema } from "@graph-explorer/shared/default-connection";
import type { z } from "zod";

import { DEFAULT_SERVICE_TYPE } from "@graph-explorer/shared/constants";
import {
  type QueryEngine,
  queryEngineOptions,
} from "@graph-explorer/shared/types";

import type { ConfigJson } from "./config-json.ts";

type DefaultConnectionPayload = z.input<typeof DefaultConnectionDataSchema>;

/**
 * The connection the proxy server serves at `/defaultConnection`, typed with
 * what the client's schema reads. The service type stays plain text, since
 * the server sends the setting as written and the client uses its default
 * for one it can't read.
 */
export type DefaultConnection = Omit<
  DefaultConnectionPayload,
  "GRAPH_EXP_SERVICE_TYPE"
> & {
  GRAPH_EXP_CONNECTION_URL: string;
  GRAPH_EXP_SERVICE_TYPE?: string;
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
    readGraphType(settings.GRAPH_TYPE, warnings) ??
    (settings.SERVICE_TYPE === "neptune-graph" ? "openCypher" : undefined);

  const fetchRequestTimeout = readPositiveNumber(
    "GRAPH_EXP_FETCH_REQUEST_TIMEOUT",
    settings,
    warnings,
  );
  const nodeExpansionLimit = readPositiveNumber(
    "GRAPH_EXP_NODE_EXPANSION_LIMIT",
    settings,
    warnings,
  );

  const defaultConnection: DefaultConnection = {
    GRAPH_EXP_CONNECTION_URL: url,
    ...(graphType && { GRAPH_EXP_GRAPH_TYPE: graphType }),
    ...(isProxied && {
      GRAPH_EXP_SERVICE_TYPE: settings.SERVICE_TYPE || DEFAULT_SERVICE_TYPE,
      GRAPH_EXP_IAM: readIam(settings.IAM, warnings),
      GRAPH_EXP_AWS_REGION: settings.AWS_REGION ?? "",
    }),
    GRAPH_EXP_USING_PROXY_SERVER: isProxied,
    ...(fetchRequestTimeout !== undefined && {
      GRAPH_EXP_FETCH_REQUEST_TIMEOUT: fetchRequestTimeout,
    }),
    ...(nodeExpansionLimit !== undefined && {
      GRAPH_EXP_NODE_EXPANSION_LIMIT: nodeExpansionLimit,
    }),
  };
  return { defaultConnection, warnings };
}

/**
 * A graph type the browser can read, or `undefined` when it is unset or one
 * the browser can't read, which would drop the whole Default Connection.
 */
function readGraphType(
  value: string | undefined,
  warnings: string[],
): QueryEngine | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  const graphType = queryEngineOptions.find(option => option === trimmed);
  if (graphType === undefined) {
    warnings.push(
      `GRAPH_TYPE is "${value}", which isn't ${new Intl.ListFormat("en", { type: "disjunction" }).format(queryEngineOptions)}, so the Default Connection leaves it out.`,
    );
  }
  return graphType;
}

function readIam(value: string | undefined, warnings: string[]) {
  const trimmed = value?.trim();
  if (!trimmed || /^false$/i.test(trimmed)) {
    return false;
  }
  if (/^true$/i.test(trimmed)) {
    return true;
  }
  warnings.push(
    `IAM is "${value}", which isn't true or false, so the Default Connection uses false.`,
  );
  return false;
}

/**
 * A positive whole number setting, or `undefined` when unset or invalid. A
 * number past `Number.MAX_SAFE_INTEGER` is invalid, since it loses digits and
 * serializes as `null` once it overflows.
 */
function readPositiveNumber(
  key: "GRAPH_EXP_FETCH_REQUEST_TIMEOUT" | "GRAPH_EXP_NODE_EXPANSION_LIMIT",
  settings: ConfigJson["values"],
  warnings: string[],
) {
  const value = settings[key];
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  const number = Number(trimmed);
  if (!/^[1-9]\d*$/.test(trimmed) || !Number.isSafeInteger(number)) {
    warnings.push(
      `${key} is "${value}", which isn't a whole number from 1 to 9007199254740991, so the Default Connection leaves it out.`,
    );
    return undefined;
  }
  return number;
}
