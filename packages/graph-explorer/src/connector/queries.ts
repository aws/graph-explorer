import { queryOptions } from "@tanstack/react-query";
import { Explorer, VertexId, typeofVertexId } from "./useGEFetchTypes";

export type NeighborCountsQueryResponse = {
  nodeId: VertexId;
  totalCount: number;
  counts: Map<string, number>;
};

/**
 * Retrieves the number of neighbors for a given node and their types.
 * @param id The node id for which to fetch the neighbors count.
 * @param explorer The service client to use for fetching the neighbors count.
 * @returns The count of neighbors for the given node as a total and per type.
 */
export const neighborsCountQuery = (id: VertexId, explorer: Explorer | null) =>
  queryOptions({
    queryKey: ["neighborsCount", id],
    enabled: !!explorer,
    staleTime: 1000 * 60, // 1 minute cache
    queryFn: async (): Promise<NeighborCountsQueryResponse | undefined> => {
      const result = await explorer?.fetchNeighborsCount({
        vertexId: id.toString(),
        idType: typeofVertexId(id),
      });

      if (!result) {
        return;
      }

      const map = Object.keys(result.counts).reduce((acc, key) => {
        acc.set(key, result.counts[key]);
        return acc;
      }, new Map<string, number>());

      return {
        nodeId: id,
        totalCount: result.totalCount,
        counts: map,
      };
    },
  });
