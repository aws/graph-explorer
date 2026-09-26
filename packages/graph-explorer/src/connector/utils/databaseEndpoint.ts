import type { NormalizedConnection } from "@/core";

import { isDirectConnection } from "@/core/StateProvider/configuration";
import { MissingDatabaseUrlError } from "@/utils";

import { apiUrl } from "./apiUrl";

/**
 * Resolves a database endpoint path for the connection: the Graph Explorer
 * server's route for a proxy connection, or the database itself for a
 * deprecated direct connection.
 */
export function databaseEndpoint(
  connection: NormalizedConnection,
  path: string,
): URL {
  if (!isDirectConnection(connection)) {
    return apiUrl(path);
  }
  if (!connection.graphDbUrl) {
    throw new MissingDatabaseUrlError();
  }
  return new URL(`${connection.graphDbUrl}/${path}`);
}
