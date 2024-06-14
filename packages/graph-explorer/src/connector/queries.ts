import { queryOptions } from "@tanstack/react-query";
import {
  Explorer,
  NeighborsRequest,
  NeighborsResponse,
  VertexId,
  typeofVertexId,
} from "./useGEFetchTypes";

function exponentialBackoff(attempt: number): number {
  return Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000);
}

/**
 * Retrieves the neighbor info for the given node using the provided filters to
 * limit the results.
 * @param request The node and filters.
 * @param explorer The service client to use for fetching the neighbors count.
 * @returns The nodes and edges for the neighbors or null.
 */
export const neighborsQuery = (
  request: NeighborsRequest | null,
  explorer: Explorer | null
) =>
  queryOptions({
    queryKey: ["neighbors", request, explorer],
    enabled: Boolean(explorer) && Boolean(request),
    staleTime: 1000 * 60, // 1 minute cache
    retry: 3,
    retryDelay: exponentialBackoff,
    queryFn: async (): Promise<NeighborsResponse | null> => {
      if (!explorer || !request) {
        return null;
      }
      return await explorer.fetchNeighbors(request);
    },
  });

export type NeighborCountsQueryResponse = {
  nodeId: VertexId;
  totalCount: number;
  counts: Record<string, number>;
};

/**
 * Retrieves the number of neighbors for a given node and their types.
 * @param id The node id for which to fetch the neighbors count.
 * @param explorer The service client to use for fetching the neighbors count.
 * @returns The count of neighbors for the given node as a total and per type.
 */
export const neighborsCountQuery = (id: VertexId, explorer: Explorer | null) =>
  queryOptions({
    queryKey: ["neighborsCount", id, explorer],
    enabled: !!explorer,
    staleTime: 1000 * 60, // 1 minute cache
    retry: 3,
    retryDelay: exponentialBackoff,
    queryFn: async (): Promise<NeighborCountsQueryResponse | undefined> => {
      const result = await explorer?.fetchNeighborsCount({
        vertexId: id.toString(),
        idType: typeofVertexId(id),
      });

      if (!result) {
        return;
      }

      return {
        nodeId: id,
        totalCount: result.totalCount,
        counts: result.counts,
      };
    },
  });
