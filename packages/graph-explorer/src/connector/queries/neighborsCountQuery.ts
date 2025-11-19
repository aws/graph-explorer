import { queryOptions } from "@tanstack/react-query";
import type { NeighborCount } from "../useGEFetchTypes";
import type { VertexId } from "@/core";
import { getExplorer } from "./helpers";

/**
 * Retrieves the number of neighbors for a given node and their types.
 * @param vertexId The node id for which to fetch the neighbors count.
 * @returns The count of neighbors for the given node as a total and per type.
 */
export function neighborsCountQuery(vertexId: VertexId) {
  return queryOptions({
    queryKey: ["vertex", vertexId, "neighbor", "count"],
    queryFn: async ({ signal, meta }): Promise<NeighborCount> => {
      const explorer = getExplorer(meta);
      const results = await explorer.neighborCounts(
        { vertexIds: [vertexId] },
        { signal },
      );

      if (!results.counts.length) {
        return {
          vertexId,
          totalCount: 0,
          counts: {},
        };
      }

      return results.counts[0];
    },
  });
}
