import { QueryClient, queryOptions } from "@tanstack/react-query";
import {
  KeywordSearchRequest,
  NeighborCount,
  SchemaResponse,
} from "../useGEFetchTypes";
import { Edge, EdgeId, Vertex, VertexId } from "@/core";
import {
  UpdateSchemaHandler,
  updateSchemaPrefixes,
} from "@/core/StateProvider/schema";
import { DEFAULT_BATCH_REQUEST_SIZE, logger } from "@/utils";
import { emptyExplorer } from "../emptyExplorer";
import { GraphExplorerMeta } from "@/core/queryClient";
import { chunk } from "lodash";

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

export function bulkNeighborCountsQuery(
  vertexIds: VertexId[],
  queryClient: QueryClient
) {
  return queryOptions({
    queryKey: ["vertices", vertexIds, "neighbor", "count"],
    staleTime: 0,
    gcTime: 0,
    queryFn: async ({ signal, meta, client }) => {
      // Bail early if request is empty
      if (!vertexIds.length) {
        return [];
      }

      const explorer = getExplorer(meta);

      // Get cached and missing IDs in one pass
      const responses: NeighborCount[] = [];
      const missingIds: VertexId[] = [];

      for (const id of vertexIds) {
        const cached = client.getQueryData(neighborsCountQuery(id).queryKey);
        if (cached) {
          responses.push(cached);
        } else {
          missingIds.push(id);
        }
      }

      // Bail early if all responses are cached
      if (!missingIds.length) {
        return responses;
      }

      // Fetch missing neighbor counts in batches
      const newResponses = await Promise.all(
        chunk(missingIds, DEFAULT_BATCH_REQUEST_SIZE).map(batch =>
          explorer
            .neighborCounts({ vertexIds: batch }, { signal })
            .then(r => r.counts)
        )
      ).then(results => results.flat());

      // Update cache and combine responses
      updateNeighborCountCache(client, newResponses);

      return [...responses, ...newResponses];
    },
    placeholderData: vertexIds
      .map(id => queryClient.getQueryData(neighborsCountQuery(id).queryKey))
      .filter(c => c != null),
  });
}

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
        { signal }
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

export function bulkVertexDetailsQuery(vertexIds: VertexId[]) {
  return queryOptions({
    queryKey: ["vertices", vertexIds],
    staleTime: 0,
    gcTime: 0,
    queryFn: async ({ client, meta, signal }) => {
      const explorer = getExplorer(meta);

      // Get cached and missing vertices in one pass
      const cachedVertices: Vertex[] = [];
      const missingIds: VertexId[] = [];

      for (const id of vertexIds) {
        const cached = client.getQueryData(
          vertexDetailsQuery(id).queryKey
        )?.vertex;
        if (cached) {
          cachedVertices.push(cached);
        } else {
          missingIds.push(id);
        }
      }

      // Return early if all vertices are cached
      if (!missingIds.length) {
        return { vertices: cachedVertices };
      }

      // Fetch missing vertices in batches
      const vertices = await Promise.all(
        chunk(missingIds, DEFAULT_BATCH_REQUEST_SIZE).map(batch =>
          explorer
            .vertexDetails({ vertexIds: batch }, { signal })
            .then(r => r.vertices)
        )
      ).then(results => results.flat());

      // Update cache
      updateVertexDetailsCache(client, vertices);

      return { vertices: [...cachedVertices, ...vertices] };
    },
  });
}

export function bulkEdgeDetailsQuery(edgeIds: EdgeId[]) {
  return queryOptions({
    queryKey: ["edges", edgeIds],
    staleTime: 0,
    gcTime: 0,
    queryFn: async ({ client, meta, signal }) => {
      const explorer = getExplorer(meta);

      // Get cached and missing edges in one pass
      const cachedEdges: Edge[] = [];
      const missingIds: EdgeId[] = [];

      for (const id of edgeIds) {
        const cached = client.getQueryData(edgeDetailsQuery(id).queryKey)?.edge;
        if (cached) {
          cachedEdges.push(cached);
        } else {
          missingIds.push(id);
        }
      }

      // Return early if all edges are cached
      if (!missingIds.length) {
        return { edges: cachedEdges };
      }

      // Fetch missing edges in batches
      const edges = await Promise.all(
        chunk(missingIds, DEFAULT_BATCH_REQUEST_SIZE).map(batch =>
          explorer
            .edgeDetails({ edgeIds: batch }, { signal })
            .then(r => r.edges)
        )
      ).then(results => results.flat());

      // Update cache
      updateEdgeDetailsCache(client, edges);

      return { edges: [...cachedEdges, ...edges] };
    },
  });
}

export function vertexDetailsQuery(vertexId: VertexId) {
  return queryOptions({
    queryKey: ["vertex", vertexId],
    queryFn: async ({ signal, meta }) => {
      const explorer = getExplorer(meta);
      const results = await explorer.vertexDetails(
        { vertexIds: [vertexId] },
        { signal }
      );

      if (!results.vertices.length) {
        return { vertex: null };
      }

      return { vertex: results.vertices[0] };
    },
  });
}

export function edgeDetailsQuery(edgeId: EdgeId) {
  return queryOptions({
    queryKey: ["edge", edgeId],
    queryFn: async ({ signal, meta }) => {
      const explorer = getExplorer(meta);
      const results = await explorer.edgeDetails(
        { edgeIds: [edgeId] },
        { signal }
      );

      if (!results.edges.length) {
        return { edge: null };
      }

      return { edge: results.edges[0] };
    },
  });
}

/** Sets the vertex details cache for the given vertices. */
export function updateVertexDetailsCache(
  queryClient: QueryClient,
  vertices: Vertex[]
) {
  for (const vertex of vertices.filter(v => !v.__isFragment)) {
    const queryKey = vertexDetailsQuery(vertex.id).queryKey;
    queryClient.setQueryData(queryKey, { vertex });
  }
}

/** Sets the edge details cache for the given edges. */
export function updateEdgeDetailsCache(
  queryClient: QueryClient,
  edges: Edge[]
) {
  for (const edge of edges.filter(e => !e.__isFragment)) {
    const queryKey = edgeDetailsQuery(edge.id).queryKey;
    queryClient.setQueryData(queryKey, { edge });
  }
}

/** Sets the neighbor count cache for the given vertex. */
export function updateNeighborCountCache(
  queryClient: QueryClient,
  neighborCounts: NeighborCount[]
) {
  for (const count of neighborCounts) {
    const queryKey = neighborsCountQuery(count.vertexId).queryKey;
    queryClient.setQueryData(queryKey, count);
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
