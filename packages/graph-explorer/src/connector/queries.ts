import { QueryClient, queryOptions } from "@tanstack/react-query";
import {
  CountsByTypeResponse,
  EdgeDetailsRequest,
  EdgeDetailsResponse,
  Explorer,
  KeywordSearchRequest,
  KeywordSearchResponse,
  VertexDetailsRequest,
  VertexDetailsResponse,
} from "./useGEFetchTypes";
import { Edge, Vertex, VertexId } from "@/core";

/**
 * Performs a search with the provided parameters.
 * @param request The search parameters to use for the query.
 * @param explorer The service client to use for fetching the neighbors count.
 * @param queryClient The query client to use for updating the cache.
 * @returns A list of nodes that match the search parameters.
 */
export function searchQuery(
  request: KeywordSearchRequest,
  explorer: Explorer | null,
  queryClient: QueryClient
) {
  return queryOptions({
    queryKey: ["keyword-search", request, explorer, queryClient],
    enabled: Boolean(explorer),
    queryFn: async ({ signal }): Promise<KeywordSearchResponse | null> => {
      if (!explorer || !request) {
        return { vertices: [], edges: [], scalars: [] };
      }
      const results = await explorer.keywordSearch(request, { signal });

      updateVertexDetailsCache(explorer, queryClient, results.vertices);

      return results;
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
 * @param vertexId The node id for which to fetch the neighbors count.
 * @param limit The limit for the neighbors count query.
 * @param explorer The service client to use for fetching the neighbors count.
 * @returns The count of neighbors for the given node as a total and per type.
 */
export function neighborsCountQuery(
  vertexId: VertexId,
  limit: number | undefined,
  explorer: Explorer | null
) {
  return queryOptions({
    queryKey: ["neighborsCount", vertexId, limit, explorer],
    enabled: Boolean(explorer),
    queryFn: async (): Promise<NeighborCountsQueryResponse> => {
      if (!explorer) {
        return {
          nodeId: vertexId,
          totalCount: 0,
          counts: {},
        };
      }

      const result = await explorer.fetchNeighborsCount({
        vertexId,
        limit,
      });

      return {
        nodeId: vertexId,
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

export function vertexDetailsQuery(
  request: VertexDetailsRequest,
  explorer: Explorer | null
) {
  const vertexId = request.vertexId;
  return queryOptions({
    queryKey: ["db", "vertex", "details", vertexId, explorer],
    queryFn: async ({ signal }): Promise<VertexDetailsResponse> => {
      if (!explorer) {
        return { vertex: null };
      }
      return await explorer.vertexDetails({ vertexId }, { signal });
    },
  });
}

export function edgeDetailsQuery(
  request: EdgeDetailsRequest,
  explorer: Explorer | null
) {
  const edgeId = request.edgeId;
  return queryOptions({
    queryKey: ["db", "edge", "details", edgeId, explorer],
    queryFn: async ({ signal }): Promise<EdgeDetailsResponse> => {
      if (!explorer) {
        return { edge: null };
      }
      return await explorer.edgeDetails({ edgeId }, { signal });
    },
  });
}

/** Sets the vertex details cache for the given vertices. */
export function updateVertexDetailsCache(
  explorer: Explorer,
  queryClient: QueryClient,
  vertices: Vertex[]
) {
  for (const vertex of vertices) {
    queryClient.setQueryData(
      ["db", "vertex", "details", vertex.id, explorer],
      vertex
    );
  }
}

/** Sets the edge details cache for the given edges. */
export function updateEdgeDetailsCache(
  explorer: Explorer,
  queryClient: QueryClient,
  edges: Edge[]
) {
  for (const edge of edges) {
    queryClient.setQueryData(
      ["db", "edge", "details", edge.id, explorer],
      edge
    );
  }
}
