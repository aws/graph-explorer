import { queryOptions } from "@tanstack/react-query";
import { atom } from "jotai";

import {
  activeConfigurationAtom,
  type EdgeConnection,
  type EdgeType,
  schemaAtom,
} from "@/core";
import { logger } from "@/utils";

import { getExplorer, getStore } from "./helpers";

/**
 * Fetches edge connections for the given edge types and persists them to the local cache on success.
 *
 * Uses `staleTime: Infinity` so the query only runs when no cached data exists
 * for the given set of edge types, or when manually triggered via `refetch()`.
 *
 * On failure, persists `lastEdgeConnectionSyncFail` so the UI can show the
 * failure after a browser refresh and automatic retry is suppressed.
 *
 * @param edgeTypes - Edge types to discover connections for. Empty array returns early without querying.
 */
export function edgeConnectionsQuery(edgeTypes: EdgeType[]) {
  // Sort edge types to keep the order consistent over time to increase the chance of hitting cache
  const sortedEdgeTypes = edgeTypes.toSorted();

  return queryOptions({
    queryKey: ["schema", "edgeConnections", sortedEdgeTypes],
    staleTime: Infinity,
    queryFn: async ({ signal, meta }) => {
      const explorer = getExplorer(meta);
      const store = getStore(meta);

      if (sortedEdgeTypes.length === 0) {
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

        return results.edgeConnections;
      } catch (error) {
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
