import { queryOptions } from "@tanstack/react-query";
import {
  CountsByTypeResponse,
  EdgeDetailsRequest,
  EdgeDetailsResponse,
  EdgeRef,
  Explorer,
  KeywordSearchRequest,
  KeywordSearchResponse,
  VertexDetailsRequest,
  VertexDetailsResponse,
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
  const ref = extractStableEntityRef(vertex);

  return queryOptions({
    queryKey: ["neighborsCount", ref, limit, explorer],
    enabled: Boolean(explorer),
    queryFn: async (): Promise<NeighborCountsQueryResponse> => {
      if (!explorer) {
        return {
          nodeId: ref.id,
          totalCount: 0,
          counts: {},
        };
      }

      const result = await explorer.fetchNeighborsCount({
        vertex: ref,
        limit,
      });

      return {
        nodeId: ref.id,
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
  const ref = extractStableEntityRef(request.vertex);
  return queryOptions({
    queryKey: ["db", "vertex", "details", ref, explorer],
    queryFn: async ({ signal }): Promise<VertexDetailsResponse> => {
      if (!explorer) {
        return { vertex: null };
      }
      return await explorer.vertexDetails({ vertex: ref }, { signal });
    },
  });
}

export function edgeDetailsQuery(
  request: EdgeDetailsRequest,
  explorer: Explorer | null
) {
  const ref = extractStableEntityRef(request.edge);
  return queryOptions({
    queryKey: ["db", "edge", "details", ref, explorer],
    queryFn: async ({ signal }): Promise<EdgeDetailsResponse> => {
      if (!explorer) {
        return { edge: null };
      }
      return await explorer.edgeDetails({ edge: ref }, { signal });
    },
  });
}

/**
 * Ensures the input does not contain any extra properties so that TanStack
 * Query can properly dedupe queries.
 */
function extractStableEntityRef<TRef extends VertexRef | EdgeRef>(
  ref: TRef
): TRef {
  return { id: ref.id, idType: ref.idType } as TRef;
}
