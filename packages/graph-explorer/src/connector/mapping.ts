import { createVertex, Entity, toEdgeMap, toNodeMap } from "@/core";
import { toMappedQueryResults } from "./useGEFetchTypes";

export function mapValuesToQueryResults(values: Entity[]) {
  // Use maps to deduplicate vertices and edges
  const vertexMap = toNodeMap(values.filter(v => v.entityType === "vertex"));

  const edgeMap = toEdgeMap(values.filter(v => v.entityType === "edge"));

  // Add fragment vertices from the edges if they are missing
  for (const edge of edgeMap.values()) {
    if (!vertexMap.has(edge.source)) {
      vertexMap.set(edge.source, createVertex({ id: edge.source, types: [] }));
    }

    if (!vertexMap.has(edge.target)) {
      vertexMap.set(edge.target, createVertex({ id: edge.target, types: [] }));
    }
  }

  const vertices = vertexMap.values().toArray();
  const edges = edgeMap.values().toArray();

  // Scalars should not be deduplicated
  const scalars = values.filter(v => v.entityType === "scalar");

  return toMappedQueryResults({ vertices, edges, scalars });
}
