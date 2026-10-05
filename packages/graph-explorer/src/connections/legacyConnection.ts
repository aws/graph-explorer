import type { ConnectionConfig, LegacyConnectionConfig } from "@shared/types";

import type { ConnectionId, SavedConnection } from "./types";

/**
 * Transforms a legacy connection (with `url` and `proxyConnection`) to the
 * canonical shape, where `graphDbUrl` is the only endpoint and a direct
 * connection is marked with `proxyConnection: false`.
 */
export function transformLegacyConnection(
  connection: LegacyConnectionConfig,
): ConnectionConfig {
  const { url, proxyConnection, ...rest } = connection;
  // A missing `proxyConnection` flag is treated as a proxy connection when
  // `graphDbUrl` — proxy-only in the legacy shape — is already present.
  const isProxyConnection =
    proxyConnection === true ||
    (proxyConnection === undefined && connection.graphDbUrl != null);

  if (isProxyConnection) {
    return { ...rest, graphDbUrl: connection.graphDbUrl || "" };
  }

  // The IAM controls only render for a proxy connection, and a direct request
  // never reaches the Proxy Server that would sign it.
  delete rest.awsAuthEnabled;
  delete rest.awsRegion;
  delete rest.serviceType;

  return {
    ...rest,
    graphDbUrl: url || connection.graphDbUrl || "",
    proxyConnection: false,
  };
}

/**
 * ReadTransform for the saved connections map: transforms each entry's
 * connection from the legacy `url`/`proxyConnection` shape to the canonical
 * shape, so every consumer of `savedConnectionsAtom` — not just the active
 * connection — sees an already-migrated connection. An entry without a
 * connection passes through untouched.
 */
export function transformSavedConnections(
  connections: Map<ConnectionId, SavedConnection>,
): Map<ConnectionId, SavedConnection> {
  return new Map(
    [...connections].map(([id, connection]) => [
      id,
      connection.connection
        ? {
            ...connection,
            connection: transformLegacyConnection(connection.connection),
          }
        : connection,
    ]),
  );
}
