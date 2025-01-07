import { queryOptions } from "@tanstack/react-query";
import {
  CountsByTypeResponse,
  Explorer,
  KeywordSearchRequest,
  KeywordSearchResponse,
  VertexRef,
} from "./useGEFetchTypes";
import { VertexId } from "@/@types/entities";

/**
 * Performs a search with the provided parameters.
 * @param request The search parameters to use for the query.
 * @param explorer The service client to use for fetching the neighbors count.
 * @returns A list of nodes that match the search parameters.
 */
export function searchQuery(
  request: KeywordSearchRequest,
  explorer: Explorer | null
) {
  return queryOptions({
    queryKey: ["keyword-search", request, explorer],
    enabled: Boolean(explorer),
    queryFn: async ({ signal }): Promise<KeywordSearchResponse | null> => {
      if (!explorer || !request) {
        return { vertices: [], edges: [], scalars: [] };
      }
      return await explorer.keywordSearch(request, { signal });
    },
  });
}

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
export function neighborsCountQuery(
  vertex: VertexRef,
  limit: number | undefined,
  explorer: Explorer | null
) {
  // Ensure the query key remains stable by removing extra properties from the vertex
  const { id, idType } = vertex;

  return queryOptions({
    queryKey: ["neighborsCount", id, idType, limit, explorer],
    enabled: Boolean(explorer),
    queryFn: async (): Promise<NeighborCountsQueryResponse | undefined> => {
      const result = await explorer?.fetchNeighborsCount({
        vertex: { id, idType },
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
}

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
