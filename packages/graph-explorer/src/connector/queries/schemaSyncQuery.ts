import { queryOptions } from "@tanstack/react-query";
import { atom } from "jotai";

import {
  activeConfigurationAtom,
  type PrefixTypeConfig,
  schemaAtom,
} from "@/core";
import {
  activeSchemaAtom,
  generateSchemaPrefixes,
  getSchemaUris,
  type SchemaStorageModel,
} from "@/core/StateProvider/schema";
import { logger } from "@/utils";
import { PrefixLookup } from "@/utils/rdf";

import type { SchemaResponse } from "../useGEFetchTypes";

import { getExplorer, getStore } from "./helpers";

/**
 * Fetches the schema from the given explorer and persists it to the local cache on success.
 *
 * Uses `staleTime: Infinity` so the query only runs when no cached data exists
 * or when manually triggered via `refetch()`.
 *
 * On failure, persists `lastSyncFail` so the UI can show the failure after
 * a browser refresh and automatic retry is suppressed.
 */
export function schemaSyncQuery(activeSchema: SchemaStorageModel | undefined) {
  return queryOptions({
    queryKey: ["schema", "discovery"],
    staleTime: Infinity,
    initialData: activeSchema,
    // Don't automatically retry if the last sync failed (persisted across sessions)
    enabled: !activeSchema?.lastSyncFail,
    queryFn: async ({ signal, meta }) => {
      const explorer = getExplorer(meta);
      const store = getStore(meta);

      try {
        const schema = await explorer.fetchSchema({ signal });

        // Generate prefixes for sparql connections
        const schemaUris = getSchemaUris(schema);
        const existingPrefixes = PrefixLookup.fromArray([]);
        const newPrefixes = generateSchemaPrefixes(
          schemaUris,
          existingPrefixes,
        );

        // Persist the schema to the local cache
        store.set(replaceSchemaAtom, schema, newPrefixes);
        const newSchema = store.get(activeSchemaAtom);
        return newSchema;
      } catch (error) {
        if (signal.aborted) {
          throw error;
        }
        store.set(setSyncFailedAtom);
        throw error;
      }
    },
  });
}

/** Setter-only atom that replaces the stored schema with the given schema response. */
const replaceSchemaAtom = atom(
  null,
  (get, set, schema: SchemaResponse, prefixes: PrefixTypeConfig[]) => {
    const id = get(activeConfigurationAtom);
    if (!id) {
      logger.warn("Cannot update schema: no active configuration");
      return;
    }

    set(schemaAtom, prev => {
      const updated = new Map(prev);
      updated.set(id, {
        ...schema,
        prefixes,

        // Reset edge connection information during schema sync
        edgeConnections: undefined,
        lastEdgeConnectionSyncFail: false,

        // Mark as completed successfully
        lastUpdate: new Date(),
        lastSyncFail: false,
      });
      return updated;
    });
  },
);

/** Setter-only atom that marks the last schema sync as failed while preserving existing data. */
const setSyncFailedAtom = atom(null, (get, set) => {
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
      lastSyncFail: true,
    });
    return updated;
  });
});
