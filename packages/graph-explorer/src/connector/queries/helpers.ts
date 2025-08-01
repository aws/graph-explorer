import { QueryClient } from "@tanstack/react-query";
import { Edge, Vertex } from "@/core";
import { NeighborCount } from "../useGEFetchTypes";
import { GraphExplorerMeta } from "@/core/queryClient";
import { logger } from "@/utils";
import { emptyExplorer } from "../emptyExplorer";
import { vertexDetailsQuery } from "./vertexDetailsQuery";
import { edgeDetailsQuery } from "./edgeDetailsQuery";
import { neighborsCountQuery } from "./neighborsCountQuery";

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
export function getExplorer(meta: GraphExplorerMeta | undefined) {
  if (!meta?.explorer) {
    logger.warn("No explorer found in the query client meta object");
    return emptyExplorer;
  }
  return meta.explorer;
}
