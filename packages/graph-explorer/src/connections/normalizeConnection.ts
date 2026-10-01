import type { ConnectionConfig } from "@shared/types";

/**
 * Cleans a URL for storage and request use: strips newlines and surrounding
 * whitespace (pasted from docs/chat), then the trailing slash. Tolerates a
 * missing value because persisted configs are not schema-validated on read, so
 * a stored connection can lack `graphDbUrl` despite the compile-time required
 * type.
 */
export function normalizeUrl(url: string | undefined): string {
  return (
    url
      ?.replace(/[\r\n]/g, "")
      .trim()
      .replace(/\/$/, "") ?? ""
  );
}

/** Whether the browser sends requests to the database itself. Deprecated. */
export function isDirectConnection(
  connection: ConnectionConfig | undefined,
): boolean {
  return connection?.proxyConnection === false;
}

export function normalizeConnection(connection: ConnectionConfig) {
  return {
    ...connection,
    graphDbUrl: normalizeUrl(connection.graphDbUrl),
    queryEngine: connection.queryEngine || "gremlin",
    awsAuthEnabled: connection.awsAuthEnabled ?? false,
  };
}
export type NormalizedConnection = ReturnType<typeof normalizeConnection>;
