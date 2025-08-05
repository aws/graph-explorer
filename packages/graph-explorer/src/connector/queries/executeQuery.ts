import { UpdateSchemaHandler, fetchEntityDetails } from "@/core";
import { queryOptions } from "@tanstack/react-query";
import { updateVertexDetailsCache, updateEdgeDetailsCache } from "../queries";
import { toMappedQueryResults } from "../useGEFetchTypes";
import { getExplorer } from "./helpers";

export function executeQuery(query: string, updateSchema: UpdateSchemaHandler) {
  return queryOptions({
    /*
     * DEV NOTE:
     * I'm intentionally leaving the query string out of the query key. This ensures the same cache entry is replaced when a new `fetchQuery` is executed.
     */
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ["execute"],
    enabled: false,
    // Don't mark cached values as stale
    staleTime: Infinity,
    // Keep the query results around for 5 minutes if the user happens to be on another tab
    gcTime: 1000 /* ms */ * 60 /* sec */ * 5 /* min */,
    queryFn: async ({ signal, meta, client }) => {
      const explorer = getExplorer(meta);
      const results = await explorer.rawQuery({ query }, { signal });

      // Update the schema and the cache
      updateVertexDetailsCache(client, results.vertices);
      updateEdgeDetailsCache(client, results.edges);

      // Fetch any details for fragments
      const details = await fetchEntityDetails(
        results.vertices.map(v => v.id),
        results.edges.map(e => e.id),
        client
      );

      // Recombine results with full details
      const combinedResults = toMappedQueryResults({
        ...results,
        vertices: details.entities.vertices,
        edges: details.entities.edges,
      });

      updateSchema(combinedResults);

      return combinedResults;
    },
  });
}
