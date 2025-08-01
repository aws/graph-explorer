import { queryOptions } from "@tanstack/react-query";
import { KeywordSearchRequest } from "../useGEFetchTypes";
import { UpdateSchemaHandler } from "@/core/StateProvider/schema";
import { getExplorer, updateVertexDetailsCache } from "./helpers";

/**
 * Performs a search with the provided parameters.
 * @param request The search parameters to use for the query.
 * @param explorer The service client to use for fetching the neighbors count.
 * @param queryClient The query client to use for updating the cache.
 * @returns A list of nodes that match the search parameters.
 */
export function searchQuery(
  request: KeywordSearchRequest,
  updateSchema: UpdateSchemaHandler
) {
  return queryOptions({
    queryKey: ["keyword-search", request],
    queryFn: async ({ signal, meta, client }) => {
      const explorer = getExplorer(meta);
      const results = await explorer.keywordSearch(request, { signal });

      updateVertexDetailsCache(client, results.vertices);
      updateSchema(results);

      return results;
    },
  });
}
