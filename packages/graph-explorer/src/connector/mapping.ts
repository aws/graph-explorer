import {
  createVertex,
  Edge,
  EntityPropertyValue,
  toEdgeMap,
  toNodeMap,
  Vertex,
} from "@/core";
import { toMappedQueryResults } from "./useGEFetchTypes";

export type MapValueResult =
  | { vertex: Vertex }
  | { edge: Edge }
  | { scalar: EntityPropertyValue };

export function mapValuesToQueryResults(values: Iterable<MapValueResult>) {
  // Use maps to deduplicate vertices and edges
  const vertexMap = toNodeMap(
    Iterator.from(values)
      .filter(e => "vertex" in e)
      .map(e => e.vertex)
  );

  const edgeMap = toEdgeMap(
    Iterator.from(values)
      .filter(e => "edge" in e)
      .map(e => e.edge)
  );

  // Add fragment vertices from the edges if they are missing
  for (const edge of edgeMap.values()) {
    if (!vertexMap.has(edge.source)) {
      vertexMap.set(
        edge.source,
        createVertex({ id: edge.source, types: edge.sourceTypes })
      );
    }

    if (!vertexMap.has(edge.target)) {
      vertexMap.set(
        edge.target,
        createVertex({ id: edge.target, types: edge.targetTypes })
      );
    }
  }

  const vertices = vertexMap.values().toArray();
  const edges = edgeMap.values().toArray();

  // Scalars should not be deduplicated
  const scalars = Iterator.from(values)
    .filter(s => "scalar" in s)
    .map(s => s.scalar)
    .toArray();

  return toMappedQueryResults({ vertices, edges, scalars });
}
