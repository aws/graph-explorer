import {
  fetchEntityDetails,
  Vertex,
  Edge,
  VertexId,
  EdgeId,
  toNodeMap,
  toEdgeMap,
  getAllGraphableEntityIds,
  ResultEntity,
  ResultVertex,
  ResultEdge,
  PatchedResultEntity,
  PatchedResultVertex,
  PatchedResultEdge,
  createPatchedResultVertex,
  createPatchedResultEdge,
} from "@/core";
import { logger } from "@/utils";
import { QueryClient } from "@tanstack/react-query";

export async function patchEntityDetails(
  client: QueryClient,
  entities: ResultEntity[]
): Promise<PatchedResultEntity[]> {
  const { vertexIds, edgeIds } = getAllGraphableEntityIds(entities);

  // Fetch all the details for vertices and edges
  const details = await fetchEntityDetails(vertexIds, edgeIds, client);

  // Throw if any of the fragment details are missing
  const missingVertices = Array.from(vertexIds).filter(
    id => !details.entities.vertices.some(v => v.id === id)
  );
  const missingEdges = Array.from(edgeIds).filter(
    id => !details.entities.edges.some(e => e.id === id)
  );

  // Ensure all details are fetched
  if (missingVertices.length > 0 || missingEdges.length > 0) {
    logger.error("Failed to fetch fragment entity details", {
      missingVertices,
      missingEdges,
    });
    throw new Error("Failed to fetch entity details");
  }

  // Create a mapping from vertex ID to full vertex details
  const vertexDetailsMap = toNodeMap(details.entities.vertices);
  const edgeDetailsMap = toEdgeMap(details.entities.edges);

  // Recursively patch entities
  return entities.map(entity =>
    patchEntity(entity, vertexDetailsMap, edgeDetailsMap)
  );
}

function patchEntity(
  entity: ResultEntity,
  vertexDetailsMap: Map<VertexId, Vertex>,
  edgeDetailsMap: Map<EdgeId, Edge>
): PatchedResultEntity {
  switch (entity.entityType) {
    case "vertex":
      return patchVertex(entity, vertexDetailsMap);
    case "edge":
      return patchEdge(entity, edgeDetailsMap, vertexDetailsMap);
    case "scalar":
      return entity; // Scalars don't need patching
    default:
      return entity;
  }
}

function patchVertex(
  vertex: ResultVertex,
  vertexDetailsMap: Map<VertexId, Vertex>
): PatchedResultVertex {
  const fullVertex = vertexDetailsMap.get(vertex.id);

  if (!fullVertex) {
    throw new Error("Failed to fetch vertex details");
  }

  return createPatchedResultVertex({
    ...fullVertex,
    name: vertex.name,
  });
}

function patchEdge(
  edge: ResultEdge,
  edgeDetailsMap: Map<EdgeId, Edge>,
  vertexDetailsMap: Map<VertexId, Vertex>
): PatchedResultEdge {
  const fullEdge = edgeDetailsMap.get(edge.id);
  const fullSource = vertexDetailsMap.get(edge.sourceId);
  const fullTarget = vertexDetailsMap.get(edge.targetId);

  if (!fullEdge || !fullSource || !fullTarget) {
    throw new Error("Failed to fetch edge details");
  }

  return createPatchedResultEdge({
    ...fullEdge,
    name: edge.name,
    sourceVertex: fullSource,
    targetVertex: fullTarget,
  });
}
