import { UpdateSchemaHandler, getAllGraphableEntities } from "@/core";
import { queryOptions } from "@tanstack/react-query";
import { updateVertexDetailsCache, updateEdgeDetailsCache } from "../queries";

import { getExplorer } from "./helpers";
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

      const { vertices, edges } = getAllGraphableEntities(results);

      // Update the schema and the cache
      updateVertexDetailsCache(client, vertices);
      updateEdgeDetailsCache(client, edges);

      // Fetch any details for fragments
      const combinedResults = await patchEntityDetails(client, results);
      const patchedGraphableEntities = getAllGraphableEntities(combinedResults);

      updateSchema(patchedGraphableEntities);

      return combinedResults;
    },
  });
}
