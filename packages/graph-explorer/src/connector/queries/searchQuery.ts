import { queryOptions } from "@tanstack/react-query";

import type { UpdateSchemaHandler } from "@/core/StateProvider/schema";

import type { KeywordSearchRequest } from "../useGEFetchTypes";

import {
  getExplorer,
  getStore,
  setVertexDetailsQueryCache,
  updateVertexGraphCanvasState,
} from "./helpers";

/**
 * Performs a search with the provided parameters.
 * @param request The search parameters to use for the query.
 * @param explorer The service client to use for fetching the neighbors count.
 * @param queryClient The query client to use for updating the cache.
 * @returns A list of nodes that match the search parameters.
 */
export function searchQuery(
  request: KeywordSearchRequest,
  updateSchema: UpdateSchemaHandler,
) {
  return queryOptions({
    queryKey: ["keyword-search", request],
    queryFn: async ({ signal, meta, client }) => {
      const explorer = getExplorer(meta);
      const store = getStore(meta);

      const results = await explorer.keywordSearch(request, { signal });

      results.vertices.forEach(vertex => {
        setVertexDetailsQueryCache(client, vertex);
      });
      updateVertexGraphCanvasState(store, results.vertices);
      updateSchema(results);

      return results;
    },
  });
}
