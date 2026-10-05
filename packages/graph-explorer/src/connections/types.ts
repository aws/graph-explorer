import type { ConnectionConfig } from "@shared/types";

import { v4 } from "uuid";

import type { Branded } from "@/utils";

export type ConnectionId = Branded<string, "ConnectionId">;

export function createConnectionId() {
  return v4() as ConnectionId;
}

/**
 * The persisted shape of a connection configuration, as stored in
 * `configurationAtom` and IndexedDB. The schema is kept separately in
 * `schemaAtom`, never embedded here.
 */
export type SavedConnection = {
  /**
   * Unique identifier for this config
   */
  id: ConnectionId;
  displayLabel?: string;
  /**
   * Connection configuration
   */
  connection?: ConnectionConfig;
};

/**
 * Represents a connection config with the ID and display label integrated in to
 * the type.
 *
 * This makes it a bit easier to deal with compared to the connection inside the
 * `SavedConnection` type since that one has a bunch of other properties and
 * the connection is optional.
 */
export type ConnectionWithId = ConnectionConfig & {
  id: ConnectionId;
  displayLabel?: string;
};
