import type { QueryClient } from "@tanstack/react-query";

import type { GraphExplorerMeta } from "@/core/queryClient";

import {
  createEdge,
  createVertex,
  edgesAtom,
  nodesAtom,
  type AppStore,
  type Edge,
  type Vertex,
} from "@/core";
import { logger } from "@/utils";

import type { ResultEntity } from "../entities";
import type { NeighborCount } from "../useGEFetchTypes";

import { emptyExplorer } from "../emptyExplorer";
import { edgeDetailsQuery } from "./edgeDetailsQuery";
import { neighborsCountQuery } from "./neighborsCountQuery";
import { vertexDetailsQuery } from "./vertexDetailsQuery";

/** Iterates over entities and adds any materialized entities to the details query cache. */
export function updateDetailsCacheFromEntities(
  client: QueryClient,
  entities: ResultEntity[],
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
  vertex: Vertex,
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
  neighborCounts: NeighborCount[],
) {
  for (const count of neighborCounts) {
    const queryKey = neighborsCountQuery(count.vertexId).queryKey;
    client.setQueryData(queryKey, count);
  }
}

/** Update the canvas data cache for the given vertices */
export function updateVertexGraphCanvasState(
  store: AppStore,
  vertices: Vertex[],
) {
  store.set(nodesAtom, prev => {
    if (vertices.length === 0) {
      return prev;
    }

    const updated = new Map(prev);
    for (const vertex of vertices) {
      if (!updated.has(vertex.id)) {
        continue;
      }
      updated.set(vertex.id, vertex);
    }

    logger.debug("Updating vertex canvas state", { vertices, prev, updated });

    return updated;
  });
}

/** Update the canvas data cache for the given edges */
export function updateEdgeGraphCanvasState(store: AppStore, edges: Edge[]) {
  store.set(edgesAtom, prev => {
    if (edges.length === 0) {
      return prev;
    }

    const updated = new Map(prev);
    for (const edge of edges) {
      if (!updated.has(edge.id)) {
        continue;
      }
      updated.set(edge.id, edge);
    }

    logger.debug("Updating edge canvas state", { edges, prev, updated });

    return updated;
  });
}

/** Extracts the explorer from the meta objects */
export function getExplorer(meta: GraphExplorerMeta | undefined) {
  if (!meta?.explorer) {
    logger.warn("No explorer found in the query client meta object");
    return emptyExplorer;
  }
  return meta.explorer;
}

/** Extracts the Jotai store from the meta objects */
export function getStore(meta: GraphExplorerMeta | undefined) {
  if (!meta?.store) {
    logger.error("No Jotai store found in the query client meta object");
    throw new Error("No Jotai store found in the query client meta object");
  }
  return meta.store;
}
