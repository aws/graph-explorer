import { QueryClient, queryOptions } from "@tanstack/react-query";
import {
  EdgeDetailsRequest,
  EdgeDetailsResponse,
  KeywordSearchRequest,
  SchemaResponse,
  VertexDetailsRequest,
  VertexDetailsResponse,
} from "./useGEFetchTypes";
import { Edge, Vertex, VertexId } from "@/core";
import {
  UpdateSchemaHandler,
  updateSchemaPrefixes,
} from "@/core/StateProvider/schema";
import { logger } from "@/utils";
import { emptyExplorer } from "./emptyExplorer";
import { GraphExplorerMeta } from "@/core/queryClient";

/**
 * Fetches the schema from the given explorer and updates the local cache with the new schema.
 * @param updateLocalCache The function to replace the schema in the cache.
 * @param explorer The explorer to use for fetching the schema.
 */
export function schemaSyncQuery(
  updateLocalCache: (schema: SchemaResponse) => void
) {
  return queryOptions({
    queryKey: ["schema"],
    queryFn: async ({ signal, meta }) => {
      const explorer = getExplorer(meta);
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
export function neighborsCountQuery(request: NeighborCountsQueryRequest) {
  return queryOptions({
    queryKey: ["neighborsCount", request],
    queryFn: async ({ signal, meta }) => {
      const explorer = getExplorer(meta);
      const result = await explorer.fetchNeighborsCount(
        {
          vertexId: request.vertexId,
        },
        { signal }
      );

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
export function nodeCountByNodeTypeQuery(nodeType: string) {
  return queryOptions({
    queryKey: ["node-count-by-node-type", nodeType],
    queryFn: ({ signal, meta }) => {
      const explorer = getExplorer(meta);
      return explorer.fetchVertexCountsByType(
        {
          label: nodeType,
        },
        { signal }
      );
    },
  });
}

export function vertexDetailsQuery(request: VertexDetailsRequest) {
  return queryOptions({
    queryKey: ["db", "vertex", "details", request],
    queryFn: ({ signal, meta }) => {
      const explorer = getExplorer(meta);
      return explorer.vertexDetails(request, { signal });
    },
  });
}

export function edgeDetailsQuery(request: EdgeDetailsRequest) {
  return queryOptions({
    queryKey: ["db", "edge", "details", request],
    queryFn: ({ signal, meta }) => {
      const explorer = getExplorer(meta);
      return explorer.edgeDetails(request, { signal });
    },
  });
}

/** Sets the vertex details cache for the given vertices. */
export function updateVertexDetailsCache(
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
    const queryKey = vertexDetailsQuery(request).queryKey;
    queryClient.setQueryData(queryKey, response);
  }
}

/** Sets the edge details cache for the given edges. */
export function updateEdgeDetailsCache(
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
    const queryKey = edgeDetailsQuery(request).queryKey;
    queryClient.setQueryData(queryKey, response);
  }
}

/** Extracts the explorer from the meta objects */
function getExplorer(meta: GraphExplorerMeta | undefined) {
  if (!meta?.explorer) {
    logger.warn("No explorer found in the query client meta object");
    return emptyExplorer;
  }
  return meta.explorer;
}
