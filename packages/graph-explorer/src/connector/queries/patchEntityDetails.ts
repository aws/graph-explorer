import { Vertex, Edge, VertexId, EdgeId, toNodeMap, toEdgeMap } from "@/core";
import { logger } from "@/utils";
import { QueryClient } from "@tanstack/react-query";
import { fetchEntityDetails } from "./fetchEntityDetails";
import {
  createPatchedResultEdge,
  createPatchedResultVertex,
  getAllGraphableEntityIds,
  PatchedResultBundle,
  PatchedResultEdge,
  PatchedResultEntity,
  PatchedResultVertex,
  ResultBundle,
  ResultEdge,
  ResultEntity,
  ResultVertex,
} from "../entities";

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
    const vertexCount =
      missingVertices.length === 0
        ? null
        : missingVertices.length === 1
          ? "1 vertex"
          : `${missingVertices.length} vertices`;
    const edgeCount =
      missingEdges.length === 0
        ? null
        : missingEdges.length === 1
          ? "1 edge"
          : `${missingEdges.length} edges`;

    const missingCount =
      vertexCount && edgeCount
        ? `${vertexCount} and ${edgeCount}`
        : vertexCount || edgeCount || "";
    logger.error("Failed to fetch fragment entity details", {
      missingVertices,
      missingEdges,
    });
    throw new PatchEntityDetailsError(
      `Failed to fetch the details of ${missingCount}.`
    );
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
    case "bundle":
      return patchBundle(entity, vertexDetailsMap, edgeDetailsMap);
  }
}

function patchVertex(
  vertex: ResultVertex,
  vertexDetailsMap: Map<VertexId, Vertex>
): PatchedResultVertex {
  const fullVertex = vertexDetailsMap.get(vertex.id);

  if (!fullVertex) {
    throw new PatchEntityDetailsError("Failed to fetch vertex details");
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

  if (!fullEdge) {
    throw new PatchEntityDetailsError(
      "Could not find the full details of the edge"
    );
  }

  if (!fullSource) {
    throw new PatchEntityDetailsError(
      "Could not find the full details of the source vertex"
    );
  }
  if (!fullTarget) {
    throw new PatchEntityDetailsError(
      "Could not find the full details of the target vertex"
    );
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

export class PatchEntityDetailsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PatchEntityDetailsError";
    Object.setPrototypeOf(this, PatchEntityDetailsError.prototype);
  }
}
