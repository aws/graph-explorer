import { Edge, PatchedResultEdge, ResultEdge } from "./edge";
import { createVertexId, createEdgeId } from "./entityIdType";
import { EntityProperties, EntityRawId } from "./shared";
import { PatchedResultVertex, ResultVertex, Vertex } from "./vertex";

/**
 * Creates a ResultVertex instance from the given options.
 */
export function createResultVertex(options: {
  id: EntityRawId;
  name?: string;
  types?: string[];
  attributes?: EntityProperties;
  isBlankNode?: boolean;
}): ResultVertex {
  return {
    entityType: "vertex",
    id: createVertexId(options.id),
    ...(options.name ? { name: options.name } : {}),
    types: options.types ?? [],
    ...(options.attributes ? { attributes: options.attributes } : {}),
    isBlankNode: options.isBlankNode ?? false,
  };
}

/**
 * Creates a PatchedResultVertex instance from the given options.
 */
export function createPatchedResultVertex(options: {
  id: EntityRawId;
  types: string[];
  attributes: EntityProperties;

  /** If not provided, then defaults to false. */
  isBlankNode?: boolean;

  /**
   * The name of the vertex provided in the query result set. This is mainly just
   * useful for user queries.
   */
  name?: string;
}): PatchedResultVertex {
  return {
    entityType: "vertex",
    id: createVertexId(options.id),
    types: options.types,
    attributes: options.attributes,
    isBlankNode: options.isBlankNode ?? false,
    ...(options.name ? { name: options.name } : {}),
  };
}

/** Constructs a Vertex instance from the given values. */
export function createVertex(options: {
  id: EntityRawId;

  /**
   * The primary type (used for styling) will be the first type in the array. If
   * no types are provided, then types will be an empty array and the primary
   * type will be empty string.
   */
  types?: string[];

  /**
   * If no attributes are provided, then defaults to an empty object.
   */
  attributes?: EntityProperties;

  /** If not provided, then defaults to false. */
  isBlankNode?: boolean;
}): Vertex {
  const types = options.types ?? [];
  return {
    id: createVertexId(options.id),
    type: types[0] ?? "",
    types,
    attributes: options.attributes != null ? options.attributes : {},
    isBlankNode: options.isBlankNode ?? false,
  };
}

/**
 * Creates a ResultEdge instance from the given options.
 */
export function createResultEdge(options: {
  id: EntityRawId;
  sourceId: EntityRawId;
  targetId: EntityRawId;
  type: string;

  /**
   * If no attributes are provided, then a future process will fetch edge
   * details to get the attributes.
   */
  attributes?: EntityProperties;

  /**
   * The name of the edge provided in the query result set. This is mainly just
   * useful for user queries.
   */
  name?: string;
}): ResultEdge {
  return {
    entityType: "edge",
    id: createEdgeId(options.id),
    sourceId: createVertexId(options.sourceId),
    targetId: createVertexId(options.targetId),
    type: options.type,
    ...(options.attributes ? { attributes: options.attributes } : {}),
    ...(options.name ? { name: options.name } : {}),
  };
}

/**
 * Creates a PatchedResultEdge instance from the given options.
 */
export function createPatchedResultEdge(options: {
  id: EntityRawId;
  sourceVertex: Vertex;
  targetVertex: Vertex;
  type: string;
  attributes: EntityProperties;

  /**
   * The name of the edge provided in the query result set. This is mainly just
   * useful for user queries.
   */
  name?: string;
}): PatchedResultEdge {
  return {
    entityType: "edge",
    id: createEdgeId(options.id),
    type: options.type,
    sourceVertex: createPatchedResultVertex({
      ...options.sourceVertex,
      isBlankNode: options.sourceVertex.isBlankNode,
      name: "source",
    }),
    targetVertex: createPatchedResultVertex({
      ...options.targetVertex,
      isBlankNode: options.targetVertex.isBlankNode,
      name: "target",
    }),
    attributes: options.attributes ?? {},
    ...(options.name ? { name: options.name } : {}),
  };
}

/** Constructs an Edge instance from the given values. */
export function createEdge(options: {
  id: EntityRawId;
  type: string;
  sourceId: EntityRawId;
  targetId: EntityRawId;
  attributes?: EntityProperties;
}): Edge {
  return {
    id: createEdgeId(options.id),
    type: options.type,
    sourceId: createVertexId(options.sourceId),
    targetId: createVertexId(options.targetId),
    attributes: options.attributes ?? {},
  };
}
