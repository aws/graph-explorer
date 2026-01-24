import { queryOptions } from "@tanstack/react-query";
import { atom } from "jotai";

import { activeConfigurationAtom, schemaAtom } from "@/core";
import { updateSchemaPrefixes } from "@/core/StateProvider/schema";

import type { SchemaResponse } from "../useGEFetchTypes";

import { getExplorer, getStore } from "./helpers";

/**
 * Fetches the schema from the given explorer and updates the local cache with the new schema.
 */
export function schemaSyncQuery() {
  return queryOptions({
    queryKey: ["schema"],
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
    return;
  }

  set(schemaAtom, prev => {
    const updated = new Map(prev);
    const existingSchema = updated.get(id);
    updated.set(id, {
      ...existingSchema,
      vertices: existingSchema?.vertices ?? [],
      edges: existingSchema?.edges ?? [],
      triedToSync: true,
      lastSyncFail: true,
    });
    return updated;
  });
});
