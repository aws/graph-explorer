import {
  Entity,
  fetchEntityDetails,
  Vertex,
  Edge,
  VertexId,
  EdgeId,
  toNodeMap,
  toEdgeMap,
  getAllGraphableEntities,
} from "@/core";
import { QueryClient } from "@tanstack/react-query";
import { updateEdgeDetailsCache, updateVertexDetailsCache } from "./helpers";

export async function patchEntityDetails(
  client: QueryClient,
  entities: Entity[]
): Promise<Entity[]> {
  // Extract all vertices and fetch their details
  const { vertices, edges } = getAllGraphableEntities(entities);

  // Update the cache with any already materialized entities
  updateVertexDetailsCache(client, vertices);
  updateEdgeDetailsCache(client, edges);

  // Fetch details for fragments
  const details = await fetchEntityDetails(
    vertices.map(v => v.id),
    edges.map(e => e.id),
    client
  );

  // Create a mapping from vertex ID to full vertex details
  const vertexDetailsMap = toNodeMap(details.entities.vertices);
  const edgeDetailsMap = toEdgeMap(details.entities.edges);

  // Recursively patch entities
  return entities.map(entity =>
    patchEntity(entity, vertexDetailsMap, edgeDetailsMap)
  );
}

function patchEntity(
  entity: Entity,
  vertexDetailsMap: Map<VertexId, Vertex>,
  edgeDetailsMap: Map<EdgeId, Edge>
): Entity {
  switch (entity.entityType) {
    case "vertex":
      return patchVertex(entity, vertexDetailsMap);
    case "edge":
      return patchEdge(entity, vertexDetailsMap, edgeDetailsMap);
    case "scalar":
      return entity;
  }
}

function patchVertex(
  vertex: Vertex,
  vertexDetailsMap: Map<VertexId, Vertex>
): Vertex {
  const fullVertex = vertexDetailsMap.get(vertex.id);
  if (fullVertex) {
    return fullVertex;
  }
  return vertex;
}

function patchEdge(
  edge: Edge,
  vertexDetailsMap: Map<VertexId, Vertex>,
  edgeDetailsMap: Map<EdgeId, Edge>
): Edge {
  // First try to get the full edge details
  const fullEdge = edgeDetailsMap.get(edge.id);
  if (fullEdge) {
    // Preserve the original name if it exists, and patch the vertices
    return {
      ...fullEdge,
      source: patchVertex(fullEdge.source, vertexDetailsMap),
      target: patchVertex(fullEdge.target, vertexDetailsMap),
    };
  }

  // If no full edge details, just patch the vertices
  return {
    ...edge,
    source: patchVertex(edge.source, vertexDetailsMap),
    target: patchVertex(edge.target, vertexDetailsMap),
  };
}
