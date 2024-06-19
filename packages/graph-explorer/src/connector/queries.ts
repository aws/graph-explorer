import { queryOptions } from "@tanstack/react-query";
import {
  CountsByTypeResponse,
  Explorer,
  NeighborsRequest,
  NeighborsResponse,
  VertexId,
  typeofVertexId,
} from "./useGEFetchTypes";

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
export const neighborsCountQuery = (
  id: VertexId,
  limit: number | undefined,
  explorer: Explorer | null
) =>
  queryOptions({
    queryKey: ["neighborsCount", id, limit, explorer],
    enabled: Boolean(explorer),
    queryFn: async (): Promise<NeighborCountsQueryResponse | undefined> => {
      const result = await explorer?.fetchNeighborsCount({
        vertexId: id.toString(),
        idType: typeofVertexId(id),
        limit,
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

/**
 * Retrieves the count of nodes for a specific node type.
 * @param nodeType A node label or class.
 * @param explorer The service client to use for fetching.
 * @returns An object with the total nodes for the given node type.
 */
export const nodeCountByNodeTypeQuery = (
  nodeType: string,
  explorer: Explorer | null
) =>
  queryOptions({
    queryKey: ["node-count-by-node-type", nodeType, explorer],
    enabled: Boolean(explorer),
    queryFn: () =>
      explorer?.fetchVertexCountsByType({
        label: nodeType,
      }) ?? nodeCountByNodeTypeEmptyResponse,
  });
const nodeCountByNodeTypeEmptyResponse: CountsByTypeResponse = { total: 0 };
