import { QueryClient, queryOptions } from "@tanstack/react-query";
import {
  EdgeDetailsRequest,
  EdgeDetailsResponse,
  Explorer,
  KeywordSearchRequest,
  KeywordSearchResponse,
  SchemaResponse,
  toMappedQueryResults,
  VertexDetailsRequest,
  VertexDetailsResponse,
} from "./useGEFetchTypes";
import { Edge, Vertex, VertexId } from "@/core";
import { updateSchemaPrefixes } from "@/core/StateProvider/schema";

/**
 * Fetches the schema from the given explorer and updates the local cache with the new schema.
 * @param updateLocalCache The function to replace the schema in the cache.
 * @param explorer The explorer to use for fetching the schema.
 */
export function schemaSyncQuery(
  updateLocalCache: (schema: SchemaResponse) => void,
  explorer: Explorer
) {
  return queryOptions({
    queryKey: ["schema", explorer],
    queryFn: async ({ signal }) => {
      let schema = await explorer.fetchSchema({ signal });

      // Update the prefixes for sparql connections
      schema = updateSchemaPrefixes(schema);

      // Update the schema in the cache
      updateLocalCache(schema);

      return schema;
    },
  });
}

/**
 * Performs a search with the provided parameters.
 * @param request The search parameters to use for the query.
 * @param explorer The service client to use for fetching the neighbors count.
 * @param queryClient The query client to use for updating the cache.
 * @returns A list of nodes that match the search parameters.
 */
export function searchQuery(
  request: KeywordSearchRequest,
  updateSchema: (entities: { vertices: Vertex[]; edges: Edge[] }) => void,
  explorer: Explorer,
  queryClient: QueryClient
) {
  return queryOptions({
    queryKey: ["keyword-search", request, explorer, queryClient],
    queryFn: async ({ signal }): Promise<KeywordSearchResponse> => {
      if (!request) {
        return toMappedQueryResults({});
      }
      const results = await explorer.keywordSearch(request, { signal });

      updateVertexDetailsCache(explorer, queryClient, results.vertices);
      updateSchema(results);

      return results;
    },
  });
}

export type NeighborCountsQueryRequest = {
  vertexId: VertexId;
};

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
  request: NeighborCountsQueryRequest,
  explorer: Explorer
) {
  return queryOptions({
    queryKey: ["neighborsCount", request, explorer],
    queryFn: async (): Promise<NeighborCountsQueryResponse> => {
      const limit = explorer.connection.nodeExpansionLimit;

      const result = await explorer.fetchNeighborsCount({
        vertexId: request.vertexId,
        limit,
      });

      return {
        nodeId: request.vertexId,
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
  explorer: Explorer
) =>
  queryOptions({
    queryKey: ["node-count-by-node-type", nodeType, explorer],
    queryFn: () =>
      explorer.fetchVertexCountsByType({
        label: nodeType,
      }),
  });

export function vertexDetailsQuery(
  request: VertexDetailsRequest,
  explorer: Explorer
) {
  return queryOptions({
    queryKey: ["db", "vertex", "details", request, explorer],
    queryFn: ({ signal }): Promise<VertexDetailsResponse> =>
      explorer.vertexDetails(request, { signal }),
  });
}

export function edgeDetailsQuery(
  request: EdgeDetailsRequest,
  explorer: Explorer
) {
  return queryOptions({
    queryKey: ["db", "edge", "details", request, explorer],
    queryFn: ({ signal }): Promise<EdgeDetailsResponse> =>
      explorer.edgeDetails(request, { signal }),
  });
}

/** Sets the vertex details cache for the given vertices. */
export function updateVertexDetailsCache(
  explorer: Explorer,
  queryClient: QueryClient,
  vertices: Vertex[]
) {
  for (const vertex of vertices.filter(v => !v.__isFragment)) {
    const request: VertexDetailsRequest = {
      vertexId: vertex.id,
    };
    const response: VertexDetailsResponse = {
      vertex,
    };
    const queryKey = vertexDetailsQuery(request, explorer).queryKey;
    queryClient.setQueryData(queryKey, response);
  }
}

/** Sets the edge details cache for the given edges. */
export function updateEdgeDetailsCache(
  explorer: Explorer,
  queryClient: QueryClient,
  edges: Edge[]
) {
  for (const edge of edges.filter(e => !e.__isFragment)) {
    const request: EdgeDetailsRequest = {
      edgeId: edge.id,
    };
    const response: EdgeDetailsResponse = {
      edge,
    };
    const queryKey = edgeDetailsQuery(request, explorer).queryKey;
    queryClient.setQueryData(queryKey, response);
  }
}
