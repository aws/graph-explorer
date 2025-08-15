import { UpdateSchemaHandler, getAllGraphableEntities } from "@/core";
import { queryOptions } from "@tanstack/react-query";
import { getExplorer, updateDetailsCacheFromEntities } from "./helpers";
import { patchEntityDetails } from "./patchEntityDetails";

export function executeUserQuery(
  query: string,
  updateSchema: UpdateSchemaHandler
) {
  return queryOptions({
    /*
     * DEV NOTE: I'm intentionally leaving the query string out of the query
     * key. This ensures the same cache entry is replaced when a new
     * `fetchQuery` is executed.
     */
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ["execute-user-query"],
    enabled: false,
    // Don't mark cached values as stale
    staleTime: Infinity,
    // Keep the query results around for 5 minutes if the user happens to be on another tab
    gcTime: 1000 /* ms */ * 60 /* sec */ * 5 /* min */,
    queryFn: async ({ signal, meta, client }) => {
      const explorer = getExplorer(meta);
      const results = await explorer.rawQuery({ query }, { signal });

      // Update the cache for any fully materialized entities
      updateDetailsCacheFromEntities(client, results);

      // Fetch any details for fragments and patch the results
      const patchedResults = await patchEntityDetails(client, results);

      // Update the schema with the results
      const patchedGraphableEntities = getAllGraphableEntities(patchedResults);
      updateSchema(patchedGraphableEntities);

      return patchedResults;
    },
  });
}
