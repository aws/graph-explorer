import { PatchedResultVertex, ResultVertex, Vertex, VertexId } from "./vertex";
import { Edge, EdgeId, PatchedResultEdge, ResultEdge } from "./edge";
import { ResultScalar } from "./scalar";
import { toEdgeMap, toNodeMap } from "../StateProvider";
import { createEdge, createVertex } from "./createEntities";

/** Represents the results of a graph database query, which may be a fragment. */
export type ResultEntity = ResultVertex | ResultEdge | ResultScalar;

/** Represents the results of a graph database query after the details have been patched. */
export type PatchedResultEntity =
  | PatchedResultVertex
  | PatchedResultEdge
  | ResultScalar;

/** An object containing both vertices and edges. */
export type Entities = {
  vertices: Vertex[];
  edges: Edge[];
};

/** An object containing both vertex and edge IDs deduplicated. */
export type GraphableEntityIds = {
  vertexIds: Set<VertexId>;
  edgeIds: Set<EdgeId>;
};

/**
 * Extracts all vertex and edge IDs from a collection of result entities.
 *
 * For vertices, adds the vertex ID to the vertex set. For edges, adds the edge ID
 * to the edge set and also adds the source and target vertex IDs to the vertex set.
 * Scalar entities are ignored. All IDs are automatically deduplicated using Sets.
 *
 * @param entities - Array of result entities (vertices, edges, or scalars)
 * @returns Object containing deduplicated sets of vertex IDs and edge IDs
 */
export function getAllGraphableEntityIds(
  entities: ResultEntity[]
): GraphableEntityIds {
  const vertexIds = new Set<VertexId>();
  const edgeIds = new Set<EdgeId>();

  for (const entity of entities) {
    if (entity.entityType === "vertex") {
      vertexIds.add(entity.id);
    } else if (entity.entityType === "edge") {
      edgeIds.add(entity.id);
      vertexIds.add(entity.sourceId);
      vertexIds.add(entity.targetId);
    }
  }

  return { vertexIds, edgeIds };
}

/**
 * Converts patched result entities into core graph entities (vertices and edges).
 *
 * For patched result vertices, creates corresponding Vertex objects. For patched result edges,
 * creates Edge objects and also creates Vertex objects for the source and target vertices.
 * Scalar entities are ignored. Vertices are automatically deduplicated by ID using a Map.
 *
 * @param entities - Array of patched result entities (vertices, edges, or scalars)
 * @returns Object containing arrays of core Vertex and Edge objects
 */
export function getAllGraphableEntities(
  entities: PatchedResultEntity[]
): Entities {
  const vertices = toNodeMap([]);
  const edges = toEdgeMap([]);

  for (const entity of entities) {
    if (entity.entityType === "vertex") {
      vertices.set(entity.id, createVertex(entity));
    } else if (entity.entityType === "edge") {
      const edge = createEdge({
        id: entity.id,
        type: entity.type,
        sourceId: entity.sourceVertex.id,
        targetId: entity.targetVertex.id,
        attributes: entity.attributes,
      });
      edges.set(entity.id, edge);
      vertices.set(entity.sourceVertex.id, createVertex(entity.sourceVertex));
      vertices.set(entity.targetVertex.id, createVertex(entity.targetVertex));
    }
  }

  return {
    vertices: vertices.values().toArray(),
    edges: edges.values().toArray(),
  };
}
