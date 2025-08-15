import { PatchedResultVertex, ResultVertex, Vertex, VertexId } from "./vertex";
import { Edge, EdgeId, PatchedResultEdge, ResultEdge } from "./edge";
import { ResultScalar } from "./scalar";
import { toEdgeMap, toNodeMap } from "../StateProvider";
import { createEdge, createVertex } from "./createEntities";
import { PatchedResultBundle, ResultBundle } from "./bundle";

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
 * An object containing both vertices and edges.
 *
 * This represents the core graph data structure used throughout the application
 * for storing and manipulating graph data.
 */
export type Entities = {
  /** Array of fully materialized vertices */
  vertices: Vertex[];
  /** Array of fully materialized edges */
  edges: Edge[];
};

/**
 * An object containing both vertex and edge IDs deduplicated.
 *
 * This is used for efficiently tracking which entities are present in a
 * result set without duplicating the full entity data.
 */
export type GraphableEntityIds = {
  /** Set of unique vertex IDs */
  vertexIds: Set<VertexId>;
  /** Set of unique edge IDs */
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
    } else if (entity.entityType === "bundle") {
      const nested = getAllGraphableEntityIds(entity.values);
      nested.vertexIds.forEach(id => vertexIds.add(id));
      nested.edgeIds.forEach(id => edgeIds.add(id));
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
    } else if (entity.entityType === "bundle") {
      const nested = getAllGraphableEntities(entity.values);
      nested.vertices.forEach(vertex => vertices.set(vertex.id, vertex));
      nested.edges.forEach(edge => edges.set(edge.id, edge));
    }
  }

  return {
    vertices: vertices.values().toArray(),
    edges: edges.values().toArray(),
  };
}
