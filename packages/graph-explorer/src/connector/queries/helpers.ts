import { QueryClient } from "@tanstack/react-query";
import { createEdge, createVertex, Edge, ResultEntity, Vertex } from "@/core";
import { NeighborCount } from "../useGEFetchTypes";
import { GraphExplorerMeta } from "@/core/queryClient";
import { logger } from "@/utils";
import { emptyExplorer } from "../emptyExplorer";
import { vertexDetailsQuery } from "./vertexDetailsQuery";
import { edgeDetailsQuery } from "./edgeDetailsQuery";
import { neighborsCountQuery } from "./neighborsCountQuery";

/** Iterates over entities and adds any materialized entities to the details query cache. */
export function updateDetailsCacheFromEntities(
  client: QueryClient,
  entities: ResultEntity[]
) {
  for (const entity of entities) {
    if (entity.entityType === "vertex" && entity.attributes != null) {
      setVertexDetailsQueryCache(client, createVertex(entity));
    } else if (entity.entityType === "edge" && entity.attributes != null) {
      setEdgeDetailsQueryCache(client, createEdge(entity));
    } else if (entity.entityType === "bundle") {
      // Recursively process entities within bundles
      updateDetailsCacheFromEntities(client, entity.values);
    }
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
