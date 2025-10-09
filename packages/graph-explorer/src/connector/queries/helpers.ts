import { type QueryClient } from "@tanstack/react-query";
import { createEdge, createVertex, type Edge, type Vertex } from "@/core";
import { type NeighborCount } from "../useGEFetchTypes";
import { type GraphExplorerMeta } from "@/core/queryClient";
import { logger } from "@/utils";
import { emptyExplorer } from "../emptyExplorer";
import { vertexDetailsQuery } from "./vertexDetailsQuery";
import { edgeDetailsQuery } from "./edgeDetailsQuery";
import { neighborsCountQuery } from "./neighborsCountQuery";
import { type ResultEntity } from "../entities";

/** Iterates over entities and adds any materialized entities to the details query cache. */
export function updateDetailsCacheFromEntities(
  client: QueryClient,
  entities: ResultEntity[]
) {
  for (const entity of entities) {
    switch (entity.entityType) {
      case "vertex":
        if (!entity.attributes) {
          break;
        }
        setVertexDetailsQueryCache(client, createVertex(entity));
        break;
      case "edge":
        if (!entity.attributes) {
          break;
        }
        setEdgeDetailsQueryCache(client, createEdge(entity));
        break;
      case "bundle":
        // Recursively process entities within bundles
        updateDetailsCacheFromEntities(client, entity.values);
        break;
      case "scalar":
        // Ignore scalar values
        break;
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
