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
  client: QueryClient,
  vertices: Iterable<Vertex>
) {
  for (const vertex of Iterator.from(vertices).filter(v => !v.__isFragment)) {
    setVertexDetailsQueryCache(client, vertex);
  }
}

/** Sets the edge details cache for the given edges. */
export function updateEdgeDetailsCache(
  client: QueryClient,
  edges: Iterable<Edge>
) {
  for (const edge of Iterator.from(edges).filter(e => !e.__isFragment)) {
    setEdgeDetailsQueryCache(client, edge);
  }
}

export function setVertexDetailsQueryCache(
  client: QueryClient,
  vertex: Vertex
) {
  const queryKey = vertexDetailsQuery(vertex.id).queryKey;
  client.setQueryData(queryKey, { vertex });
}

export function setEdgeDetailsQueryCache(client: QueryClient, edge: Edge) {
  const queryKey = edgeDetailsQuery(edge.id).queryKey;
  client.setQueryData(queryKey, { edge });
}

/** Sets the neighbor count cache for the given vertex. */
export function updateNeighborCountCache(
  client: QueryClient,
  neighborCounts: NeighborCount[]
) {
  for (const count of neighborCounts) {
    const queryKey = neighborsCountQuery(count.vertexId).queryKey;
    client.setQueryData(queryKey, count);
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
