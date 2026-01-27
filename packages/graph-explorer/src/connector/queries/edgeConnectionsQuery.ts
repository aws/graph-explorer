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
 * Creates query options for fetching edge connections from the database.
 *
 * Updates the schema store with discovered edge connections on success,
 * or marks the schema as failed on error.
 */
export function edgeConnectionsQuery(edgeTypes: EdgeType[]) {
  // Sort edge type to keep the order consistent over time to increase the chance of hitting cache
  const sortedEdgeTypes = edgeTypes.toSorted();

  return queryOptions({
    queryKey: ["schema", "edgeConnections", sortedEdgeTypes],
    queryFn: async ({ signal, meta }) => {
      const explorer = getExplorer(meta);
      const store = getStore(meta);

      if (sortedEdgeTypes.length === 0) {
        return [];
      }

      try {
        const results = await explorer.fetchEdgeConnections(
          { edgeTypes: sortedEdgeTypes },
          { signal },
        );

        // Update edge connections
        logger.debug(
          "Setting edge connections in store",
          results.edgeConnections,
        );
        store.set(setEdgeConnectionsAtom, results.edgeConnections);

        return results.edgeConnections;
      } catch (err: unknown) {
        logger.warn(
          "Failed to discover the edge connections. Storing the failure in the schema cache.",
          err,
        );
        store.set(setSyncFailureAtom);
        throw err;
      }
    },
  });
}

/** Setter-only atom to update edge connections in the active schema. */
export const setEdgeConnectionsAtom = atom(
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
      });
      return updated;
    });
  },
);

/** Setter-only atom that marks the schema sync as failed while preserving existing data. */
const setSyncFailureAtom = atom(null, (get, set) => {
  const id = get(activeConfigurationAtom);
  if (!id) {
    logger.warn("Cannot update schema: no active configuration");
    return;
  }

  set(schemaAtom, prev => {
    const updated = new Map(prev);
    const existingSchema = updated.get(id);
    updated.set(id, {
      ...existingSchema,
      vertices: existingSchema?.vertices ?? [],
      edges: existingSchema?.edges ?? [],
      edgeConnections: existingSchema?.edgeConnections ?? [],
      edgeConnectionDiscoveryFailed: true,
    });
    return updated;
  });
});
