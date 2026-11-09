import type { ConnectionConfig, QueryEngine } from "@shared/types";

import { storedPositiveWholeNumberSchema } from "@/core/positiveWholeNumber";

/**
 * Cleans a URL for storage and request use: strips newlines and surrounding
 * whitespace (pasted from docs/chat), then the trailing slash. Tolerates a
 * missing value because a stored connection can lack `graphDbUrl` despite the
 * compile-time required type.
 */
export function normalizeUrl(url: string | undefined): string {
  return (
    url
      ?.replace(/[\r\n]/g, "")
      .trim()
      .replace(/\/$/, "") ?? ""
  );
}

/** Whether the browser sends requests to the database itself. */
export function isDirectConnection(
  connection: ConnectionConfig | undefined,
): boolean {
  return connection?.proxyConnection === false;
}

/**
 * Reads a stored connection with the app's defaults applied. A numeric
 * override that is not a positive integer reads as absent, and IAM is on only
 * when stored as exactly `true`.
 */
export function normalizeConnection(
  connection: ConnectionConfig,
): NormalizedConnection {
  const {
    fetchTimeoutMs: storedFetchTimeoutMs,
    nodeExpansionLimit: storedNodeExpansionLimit,
    ...rest
  } = connection;
  const fetchTimeoutMs =
    storedPositiveWholeNumberSchema.parse(storedFetchTimeoutMs);
  const nodeExpansionLimit = storedPositiveWholeNumberSchema.parse(
    storedNodeExpansionLimit,
  );
  return {
    ...rest,
    graphDbUrl: normalizeUrl(connection.graphDbUrl),
    queryEngine: connection.queryEngine || "gremlin",
    awsAuthEnabled: connection.awsAuthEnabled === true,
    ...(fetchTimeoutMs && { fetchTimeoutMs }),
    ...(nodeExpansionLimit && { nodeExpansionLimit }),
  };
}

export type NormalizedConnection = ConnectionConfig & {
  queryEngine: QueryEngine;
  awsAuthEnabled: boolean;
};
