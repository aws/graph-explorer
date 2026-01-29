import { queryOptions } from "@tanstack/react-query";
import { atom } from "jotai";

import {
  activeConfigurationAtom,
  type EdgeConnection,
  type EdgeType,
  maybeActiveSchemaAtom,
  schemaAtom,
} from "@/core";
import { logger } from "@/utils";

import { getExplorer, getStore } from "./helpers";
import { schemaSyncQuery } from "./schemaSyncQuery";

/**
 * Creates query options for fetching edge connections from the database.
 *
 * Updates the schema store with discovered edge connections on success,
 * or marks the schema as failed on error.
 *
 * @param edgeTypes - Edge types to discover connections for. Empty array returns early without querying.
 */
export function edgeConnectionsQuery(edgeTypes: EdgeType[]) {
  // Sort edge types to keep the order consistent over time to increase the chance of hitting cache
  const sortedEdgeTypes = edgeTypes.toSorted();

  return queryOptions({
    queryKey: ["schema", "edgeConnections", sortedEdgeTypes],
    queryFn: async ({ signal, client, meta }) => {
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

        const updatedSchema = store.get(maybeActiveSchemaAtom);
        logger.debug(
          "Updating schema in query after edge connection discovery success",
          updatedSchema,
        );
        client.setQueryData(schemaSyncQuery().queryKey, updatedSchema);

        return results.edgeConnections;
      } catch (err: unknown) {
        logger.warn(
          "Failed to discover edge connections. Storing failure in schema cache.",
          err,
        );
        store.set(setEdgeDiscoveryFailureAtom);
        const updatedSchema = store.get(maybeActiveSchemaAtom);
        logger.debug(
          "Updating schema in query after edge connection discovery failure",
          updatedSchema,
        );
        client.setQueryData(schemaSyncQuery().queryKey, updatedSchema);
        throw err;
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
        // Clear any previous failures
        edgeConnectionDiscoveryFailed: false,
      });
      return updated;
    });
  },
);

/**
 * Setter-only atom that marks edge connection discovery as failed.
 * Preserves existing schema data while setting the failure flag.
 */
const setEdgeDiscoveryFailureAtom = atom(null, (get, set) => {
  const id = get(activeConfigurationAtom);
  if (!id) {
    logger.warn("Cannot update schema: no active configuration");
    return;
  }

  set(schemaAtom, prev => {
    const updated = new Map(prev);
    const existingSchema = updated.get(id);
    const updatedSchema = {
      ...existingSchema,
      vertices: existingSchema?.vertices ?? [],
      edges: existingSchema?.edges ?? [],
      edgeConnections: existingSchema?.edgeConnections ?? [],
      edgeConnectionDiscoveryFailed: true,
    };
    logger.debug("Setting edge discovery failure to the schema", updatedSchema);
    updated.set(id, updatedSchema);
    return updated;
  });
});
