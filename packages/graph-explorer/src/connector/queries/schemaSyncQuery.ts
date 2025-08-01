import { queryOptions } from "@tanstack/react-query";
import { SchemaResponse } from "../useGEFetchTypes";
import { updateSchemaPrefixes } from "@/core/StateProvider/schema";
import { getExplorer } from "./helpers";

/**
 * Fetches the schema from the given explorer and updates the local cache with the new schema.
 * @param updateLocalCache The function to replace the schema in the cache.
 * @param explorer The explorer to use for fetching the schema.
 */
export function schemaSyncQuery(
  updateLocalCache: (schema: SchemaResponse) => void
) {
  return queryOptions({
    queryKey: ["schema"],
    queryFn: async ({ signal, meta }) => {
      const explorer = getExplorer(meta);
      let schema = await explorer.fetchSchema({ signal });

      // Update the prefixes for sparql connections
      schema = updateSchemaPrefixes(schema);

      // Update the schema in the cache
      updateLocalCache(schema);

      return schema;
    },
  });
}
