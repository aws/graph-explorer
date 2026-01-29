import { queryOptions } from "@tanstack/react-query";
import { atom } from "jotai";

import { activeConfigurationAtom, schemaAtom } from "@/core";
import {
  type SchemaStorageModel,
  updateSchemaPrefixes,
} from "@/core/StateProvider/schema";
import { logger } from "@/utils";

import type { SchemaResponse } from "../useGEFetchTypes";

import { getExplorer, getStore } from "./helpers";

/**
 * Fetches the schema from the given explorer and updates the local cache with the new schema.
 */
export function schemaSyncQuery() {
  return queryOptions({
    queryKey: ["schema", "discovery"],
    queryFn: async ({ signal, meta }) => {
      const explorer = getExplorer(meta);
      const store = getStore(meta);

      try {
        let schema = await explorer.fetchSchema({ signal });

        // Update the prefixes for sparql connections
        schema = updateSchemaPrefixes(schema);

        // Update the schema in the cache
        store.set(replaceSchemaAtom, schema);

        return schema;
      } catch (error: unknown) {
        // If the schema sync fails, set the schema to a failed state
        store.set(setSyncFailureAtom);
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
    const updated = new Map(prev);
    updated.set(id, {
      ...schema,
      triedToSync: true,
      lastUpdate: new Date(),
      lastSyncFail: false,
    });
    return updated;
  });
});

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
    const updatedSchema: SchemaStorageModel = {
      ...existingSchema,
      vertices: existingSchema?.vertices ?? [],
      edges: existingSchema?.edges ?? [],
      edgeConnections: existingSchema?.edgeConnections ?? [],
      triedToSync: true,
      lastSyncFail: true,
      edgeConnectionDiscoveryFailed: true,
    };
    logger.debug("Setting sync failure to the schema", updatedSchema);
    updated.set(id, updatedSchema);
    return updated;
  });
});
