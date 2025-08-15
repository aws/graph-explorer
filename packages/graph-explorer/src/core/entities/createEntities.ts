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
    name: options.name,
    types: options.types ?? [],
    attributes: options.attributes,
    isBlankNode: options.isBlankNode ?? false,
  };
}

/**
 * Creates a PatchedResultVertex instance from the given options.
 */
export function createPatchedResultVertex(options: {
  id: EntityRawId;
  name?: string;
  types: string[];
  attributes: EntityProperties;
  isBlankNode?: boolean;
}): PatchedResultVertex {
  return {
    entityType: "vertex",
    id: createVertexId(options.id),
    name: options.name,
    types: options.types,
    attributes: options.attributes,
    isBlankNode: options.isBlankNode ?? false,
  };
}

/** Constructs a Vertex instance from the given values. */
export function createVertex(options: {
  id: EntityRawId;
  types?: string[];
  attributes?: EntityProperties;
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
  name?: string;
  type: string;
  attributes?: EntityProperties;
  sourceId: EntityRawId;
  targetId: EntityRawId;
}): ResultEdge {
  return {
    entityType: "edge",
    id: createEdgeId(options.id),
    name: options.name,
    type: options.type,
    sourceId: createVertexId(options.sourceId),
    targetId: createVertexId(options.targetId),
    attributes: options.attributes,
  };
}

/**
 * Creates a PatchedResultEdge instance from the given options.
 */
export function createPatchedResultEdge(options: {
  id: EntityRawId;
  type: string;
  attributes?: EntityProperties;
  sourceVertex: Vertex;
  targetVertex: Vertex;
  name?: string;
}): PatchedResultEdge {
  return {
    entityType: "edge",
    id: createEdgeId(options.id),
    name: options.name,
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
