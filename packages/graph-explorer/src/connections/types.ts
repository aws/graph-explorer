import type { ConnectionConfig } from "@shared/types";

import { v4 } from "uuid";

import type { Branded } from "@/utils";

export type ConnectionId = Branded<string, "ConnectionId">;

/**
 * Brands an existing string as a {@link ConnectionId}.
 * @param id The string identifying the connection
 */
export function createConnectionId(id: string): ConnectionId {
  return id as ConnectionId;
}

/** Generates a fresh, randomly-generated {@link ConnectionId}. */
export function createNewConnectionId(): ConnectionId {
  return createConnectionId(v4());
}

/**
 * The persisted shape of a saved connection, as stored in
 * `savedConnectionsAtom` and IndexedDB. The schema is kept separately in
 * `schemaAtom`, never embedded here.
 */
export type SavedConnection = {
  /**
   * Unique identifier for this connection
   */
  id: ConnectionId;
  displayLabel?: string;
  /**
   * Connection details
   */
  connection?: ConnectionConfig;
};

/**
 * Represents a connection with the ID and display label integrated in to
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
