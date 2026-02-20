import { queryOptions } from "@tanstack/react-query";
import { atom } from "jotai";

import { activeConfigurationAtom, schemaAtom } from "@/core";
import { updateSchemaPrefixes } from "@/core/StateProvider/schema";
import { logger } from "@/utils";

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
export function schemaSyncQuery() {
  return queryOptions({
    queryKey: ["schema", "discovery"],
    staleTime: Infinity,
    queryFn: async ({ signal, meta }) => {
      const explorer = getExplorer(meta);
      const store = getStore(meta);

      try {
        let schema = await explorer.fetchSchema({ signal });

        // Update the prefixes for sparql connections
        schema = updateSchemaPrefixes(schema);

        // Persist the schema to the local cache
        store.set(replaceSchemaAtom, schema);

        return schema;
      } catch (error) {
        store.set(setSyncFailedAtom);
        throw error;
      }
    },
  });
}

/** Setter-only atom that replaces the stored schema with the given schema response. */
const replaceSchemaAtom = atom(null, (get, set, schema: SchemaResponse) => {
  const id = get(activeConfigurationAtom);
  if (!id) {
    logger.warn("Cannot update schema: no active configuration");
    return;
  }

  set(schemaAtom, prev => {
    const existing = prev.get(id);
    const updated = new Map(prev);
    updated.set(id, {
      ...schema,
      edgeConnections: existing?.edgeConnections,
      lastUpdate: new Date(),
      lastSyncFail: false,
    });
    return updated;
  });
});

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
