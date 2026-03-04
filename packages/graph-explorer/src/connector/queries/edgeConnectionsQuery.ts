import { queryOptions } from "@tanstack/react-query";
import { atom } from "jotai";

import {
  activeConfigurationAtom,
  activeSchemaAtom,
  type EdgeConnection,
  schemaAtom,
  type SchemaStorageModel,
} from "@/core";
import { logger } from "@/utils";

import { getExplorer, getStore } from "./helpers";
import { schemaSyncQuery } from "./schemaSyncQuery";

/**
 * Fetches edge connections for the edge types in the active schema and persists
 * them to the local cache on success.
 *
 * Uses `staleTime: Infinity` so the query only runs when no cached data exists
 * for the given set of edge types, or when manually triggered via `refetch()`.
 *
 * On failure, persists `lastEdgeConnectionSyncFail` so the UI can show the
 * failure after a browser refresh and automatic retry is suppressed.
 *
 * @param activeSchema - The active schema to derive edge types from. `undefined`
 *   disables the query.
 */
export function edgeConnectionsQuery(
  activeSchema: SchemaStorageModel | undefined,
) {
  // Sort edge types to keep the order consistent over time to increase the chance of hitting cache
  const sortedEdgeTypes = activeSchema?.edges.map(e => e.type).toSorted() ?? [];

  return queryOptions({
    queryKey: ["schema", "edgeConnections", sortedEdgeTypes],
    staleTime: Infinity,
    enabled: activeSchema != null && !activeSchema.lastEdgeConnectionSyncFail,
    initialData: activeSchema?.edgeConnections,
    queryFn: async ({ signal, meta, client }) => {
      const explorer = getExplorer(meta);
      const store = getStore(meta);

      if (sortedEdgeTypes.length === 0) {
        logger.log(
          "Edge type list is empty, so writing empty edge connections list",
        );
        store.set(setEdgeConnectionsAtom, []);
        return [];
      }

      logger.log("Fetching edge connections", sortedEdgeTypes);

      try {
        const results = await explorer.fetchEdgeConnections(
          { edgeTypes: sortedEdgeTypes },
          { signal },
        );

        logger.debug(
          "Setting edge connections in store",
          results.edgeConnections,
        );
        store.set(setEdgeConnectionsAtom, results.edgeConnections);

        // Update the cached schema for the schema sync query
        const newSchema = store.get(activeSchemaAtom);
        client.setQueryData(schemaSyncQuery(activeSchema).queryKey, newSchema);

        return results.edgeConnections;
      } catch (error) {
        if (signal.aborted) {
          throw error;
        }
        logger.warn("Failed to discover edge connections", error);
        store.set(setEdgeConnectionSyncFailedAtom);
        throw error;
      }
    },
  });
}

/** Setter-only atom to update edge connections in the active schema. */
const setEdgeConnectionsAtom = atom(
  null,
  (get, set, edgeConnections: EdgeConnection[]) => {
    const activeConfigId = get(activeConfigurationAtom);
    if (!activeConfigId) {
      return;
    }
    set(schemaAtom, prev => {
      const activeSchema = prev.get(activeConfigId);
      if (!activeSchema) {
        return prev;
      }
      const updated = new Map(prev);
      updated.set(activeConfigId, {
        ...activeSchema,
        edgeConnections,
        lastEdgeConnectionSyncFail: false,
      });
      return updated;
    });
  },
);

/** Setter-only atom that marks edge connection sync as failed while preserving existing data. */
const setEdgeConnectionSyncFailedAtom = atom(null, (get, set) => {
  const id = get(activeConfigurationAtom);
  if (!id) {
    logger.warn("Cannot update schema: no active configuration");
    return;
  }

  set(schemaAtom, prev => {
    const existing = prev.get(id);
    const updated = new Map(prev);
    updated.set(id, {
      ...existing,
      vertices: existing?.vertices ?? [],
      edges: existing?.edges ?? [],
      lastEdgeConnectionSyncFail: true,
    });
    return updated;
  });
});
