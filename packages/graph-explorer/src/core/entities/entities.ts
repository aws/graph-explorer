import { Vertex } from "./vertex";
import { Edge } from "./edge";
import { Scalar } from "./scalar";
import { toEdgeMap, toNodeMap } from "../StateProvider";

export type Entity = Vertex | Edge | Scalar;
export type GraphableEntity = Vertex | Edge;

export type Entities = {
  vertices: Vertex[];
  edges: Edge[];
};

/**
 * Gets all the vertices nested within any entities in to one single flat list.
 *
 * Uses a generator funnction to avoid allocating a new array for the whole
 * list.
 */
export function getAllVertices(entities: Entity[]): Vertex[] {
  const results: Vertex[] = [];
  for (const entity of entities) {
    if (entity.entityType === "vertex") {
      results.push(entity);
    }
  }
  return results;
}

/**
 * Gets all the edges nested within any entities in to one single flat list.
 *
 * Uses a generator funnction to avoid allocating a new array for the whole
 * list.
 */
export function getAllEdges(entities: Entity[]): Edge[] {
  const results: Edge[] = [];
  for (const entity of entities) {
    if (entity.entityType === "edge") {
      results.push(entity);
    }
  }
  return results;
}

export function getAllGraphableEntities(entities: Entity[]): Entities {
  const vertices = toNodeMap([]);
  const edges = toEdgeMap([]);

  for (const entity of entities) {
    if (entity.entityType === "vertex") {
      vertices.set(entity.id, entity);
    } else if (entity.entityType === "edge") {
      edges.set(entity.id, entity);
    }
  }

  return {
    vertices: vertices.values().toArray(),
    edges: edges.values().toArray(),
  };
}
