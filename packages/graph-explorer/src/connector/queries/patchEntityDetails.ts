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

export async function patchEntityDetails(
  client: QueryClient,
  entities: Entity[]
): Promise<Entity[]> {
  // Extract all vertices and fetch their details
  const { vertices, edges } = getAllGraphableEntities(entities);
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
      return patchEdge(entity, edgeDetailsMap);
    case "scalar":
      return entity; // Scalars don't need patching
    default:
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

function patchEdge(edge: Edge, edgeDetailsMap: Map<EdgeId, Edge>): Edge {
  // First try to get the full edge details
  const fullEdge = edgeDetailsMap.get(edge.id);
  if (fullEdge) {
    return fullEdge;
  }

  return edge;
}
