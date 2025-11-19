import {
  createEdge,
  createVertex,
  type EdgeId,
  type Entities,
  toEdgeMap,
  toNodeMap,
  type VertexId,
} from "@/core";
import type { PatchedResultBundle, ResultBundle } from "./bundle";
import type { PatchedResultEdge, ResultEdge } from "./edge";
import type { ResultScalar } from "./scalar";
import type { PatchedResultVertex, ResultVertex } from "./vertex";

/**
 * Represents the results of a graph database query, which may be a fragment.
 *
 * A fragment means that some entities (vertices or edges) may not have their
 * complete attribute data loaded yet and will need to be "patched" by fetching
 * additional details from the database.
 */
export type ResultEntity =
  | ResultVertex
  | ResultEdge
  | ResultScalar
  | ResultBundle;

/**
 * Represents the results of a graph database query after the details have been patched.
 *
 * All entities in this union type are guaranteed to have their complete data
 * loaded, including all attributes for vertices and edges.
 */
export type PatchedResultEntity =
  | PatchedResultVertex
  | PatchedResultEdge
  | ResultScalar
  | PatchedResultBundle;

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
export function getAllGraphableEntityIds(entities: ResultEntity[]) {
  const vertexIds = new Set<VertexId>();
  const edgeIds = new Set<EdgeId>();

  for (const entity of entities) {
    switch (entity.entityType) {
      case "vertex":
        vertexIds.add(entity.id);
        break;
      case "edge":
        edgeIds.add(entity.id);
        vertexIds.add(entity.sourceId);
        vertexIds.add(entity.targetId);
        break;
      case "bundle": {
        const nested = getAllGraphableEntityIds(entity.values);
        nested.vertexIds.forEach(id => vertexIds.add(id));
        nested.edgeIds.forEach(id => edgeIds.add(id));
        break;
      }
      case "scalar":
        // Scalars are ignored
        break;
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
  entities: PatchedResultEntity[],
): Entities {
  const vertices = toNodeMap([]);
  const edges = toEdgeMap([]);

  for (const entity of entities) {
    switch (entity.entityType) {
      case "patched-vertex":
        vertices.set(entity.id, createVertex(entity));
        break;
      case "patched-edge": {
        const edge = createEdge({
          id: entity.id,
          type: entity.type,
          sourceId: entity.source.id,
          targetId: entity.target.id,
          attributes: entity.attributes,
        });
        edges.set(entity.id, edge);
        vertices.set(entity.source.id, createVertex(entity.source));
        vertices.set(entity.target.id, createVertex(entity.target));
        break;
      }
      case "bundle": {
        const nested = getAllGraphableEntities(entity.values);
        nested.vertices.forEach(vertex => vertices.set(vertex.id, vertex));
        nested.edges.forEach(edge => edges.set(edge.id, edge));
        break;
      }
      case "scalar":
        // Scalars are ignored
        break;
    }
  }

  return {
    vertices: vertices.values().toArray(),
    edges: edges.values().toArray(),
  };
}
