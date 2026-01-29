import { queryOptions } from "@tanstack/react-query";

import type { UpdateSchemaHandler } from "@/core/StateProvider/schema";

import type { FilterAndSortRequest } from "../useGEFetchTypes";

import {
  getExplorer,
  getStore,
  setVertexDetailsQueryCache,
  updateVertexGraphCanvasState,
} from "./helpers";

/**
 * Performs a filter-and-sort query with the provided parameters.
 * @param request The filter/sort parameters to use for the query.
 * @param updateSchema Handler to update schema from results.
 * @returns Query options for vertices matching the filter/sort criteria.
 */
export function filterAndSortQuery(
  request: FilterAndSortRequest,
  updateSchema: UpdateSchemaHandler,
) {
  return queryOptions({
    queryKey: ["filter-and-sort", request],
    queryFn: async ({ signal, meta, client }) => {
      const explorer = getExplorer(meta);
      const store = getStore(meta);

      const results = await explorer.filterAndSortSearch(request, { signal });

      results.vertices.forEach(vertex => {
        setVertexDetailsQueryCache(client, vertex);
      });
      updateVertexGraphCanvasState(store, results.vertices);
      updateSchema(results);

      return results;
    },
  });
}
