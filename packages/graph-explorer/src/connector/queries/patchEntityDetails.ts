import {
  type Vertex,
  type Edge,
  type VertexId,
  type EdgeId,
  toNodeMap,
  toEdgeMap,
  createVertex,
} from "@/core";
import type { QueryClient } from "@tanstack/react-query";
import { fetchEntityDetails } from "./fetchEntityDetails";
import {
  createPatchedResultEdge,
  createPatchedResultVertex,
  getAllGraphableEntityIds,
  type PatchedResultBundle,
  type PatchedResultEdge,
  type PatchedResultEntity,
  type PatchedResultVertex,
  type ResultBundle,
  type ResultEdge,
  type ResultEntity,
  type ResultVertex,
} from "../entities";

export async function patchEntityDetails(
  client: QueryClient,
  entities: ResultEntity[]
): Promise<PatchedResultEntity[]> {
  const { vertexIds, edgeIds } = getAllGraphableEntityIds(entities);

  // Fetch all the details for vertices and edges
  const details = await fetchEntityDetails(vertexIds, edgeIds, client);

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
    case "bundle":
      return patchBundle(entity, vertexDetailsMap, edgeDetailsMap);
  }
}

function patchVertex(
  vertex: ResultVertex,
  vertexDetailsMap: Map<VertexId, Vertex>
): PatchedResultVertex {
  const fullVertex = vertexDetailsMap.get(vertex.id) ?? createVertex(vertex);

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
  const fullSource =
    vertexDetailsMap.get(edge.sourceId) ?? createVertex({ id: edge.sourceId });
  const fullTarget =
    vertexDetailsMap.get(edge.targetId) ?? createVertex({ id: edge.targetId });

  if (!fullEdge) {
    throw new Error("Failed to fetch edge details");
  }

  return createPatchedResultEdge({
    ...fullEdge,
    name: edge.name,
    sourceVertex: fullSource,
    targetVertex: fullTarget,
  });
}

function patchBundle(
  bundle: ResultBundle,
  vertexDetailsMap: Map<VertexId, Vertex>,
  edgeDetailsMap: Map<EdgeId, Edge>
): PatchedResultBundle {
  return {
    ...bundle,
    values: bundle.values.map(child =>
      patchEntity(child, vertexDetailsMap, edgeDetailsMap)
    ),
  };
}
