import { queryOptions } from "@tanstack/react-query";

import type { UpdateSchemaHandler } from "@/core";

import { getAllGraphableEntities } from "../entities";
import {
  getExplorer,
  getStore,
  updateDetailsCacheFromEntities,
  updateEdgeGraphCanvasState,
  updateVertexGraphCanvasState,
} from "./helpers";
import { patchEntityDetails } from "./patchEntityDetails";

export function executeUserQuery(
  query: string,
  updateSchema: UpdateSchemaHandler,
) {
  // oxlint-disable-next-line @tanstack/query/exhaustive-deps -- intentionally static key so repeated fetchQuery calls replace the same cache entry
  return queryOptions({
    queryKey: ["execute-user-query"],
    enabled: false,
    // Don't mark cached values as stale
    staleTime: Infinity,
    // Keep the query results around for 5 minutes if the user happens to be on another tab
    gcTime: 1000 /* ms */ * 60 /* sec */ * 5 /* min */,
    // Disable retries since query could be a mutation
    retry: false,
    queryFn: async ({ signal, meta, client }) => {
      const explorer = getExplorer(meta);
      const store = getStore(meta);
      const response = await explorer.rawQuery({ query }, { signal });

      // Update the cache for any fully materialized entities
      updateDetailsCacheFromEntities(client, response.results);

      // Fetch any details for fragments and patch the results
      const patchedResults = await patchEntityDetails(client, response.results);

      // Update the schema with the results
      const patchedGraphableEntities = getAllGraphableEntities(patchedResults);
      updateSchema(patchedGraphableEntities);
      updateVertexGraphCanvasState(store, patchedGraphableEntities.vertices);
      updateEdgeGraphCanvasState(store, patchedGraphableEntities.edges);

      return { results: patchedResults, rawResponse: response.rawResponse };
    },
  });
}
