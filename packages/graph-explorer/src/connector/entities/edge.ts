import {
  createEdgeId,
  createEdgeType,
  createVertexId,
  type EdgeId,
  type EdgeType,
  type EntityProperties,
  type EntityRawId,
  type Vertex,
  type VertexId,
} from "@/core";

import { createPatchedResultVertex, type PatchedResultVertex } from "./vertex";

/**
 * An edge result from a graph database query.
 *
 * If the attributes are undefined, the edge is assumed to be a fragment and
 * will have their details fetched from the database.
 */
export type ResultEdge = {
  /**
   * Indicates the type in order to discriminate from other result types in
   * unions.
   */
  entityType: "edge";

  /**
   * Unique identifier for the edge.
   * - For PG, the edge id
   * - For RDF, predicates do not have ids like PG graphs. So, a synthetic id is
   *   created using <source URI>-[predicate]-><target URI>
   */
  id: EdgeId;

  /**
   * The name of the vertex in the original result set.
   */
  name?: string;

  /**
   * Edge type.
   * - For PG, the label which identifies the relation type
   * - For RDF, the predicate
   */
  type: EdgeType;
  /**
   * Source vertex id
   */
  sourceId: VertexId;
  /**
   * Target vertex id
   */
  targetId: VertexId;

  /**
   * Only for PG, attributes associated to the edge. If it is undefined the edge
   * is assumed to be a fragment. For RDF, predicates do not have more
   * properties than the predicate itself.
   */
  attributes?: EntityProperties;
};

/**
 * An edge result after it has been patched with the full edge details, including
 * the patched vertex results for source and target.
 *
 * This type represents a `ResultEdge` that has been enriched with complete
 * attribute data and full vertex objects for the source and target vertices.
 */
export type PatchedResultEdge = Omit<
  ResultEdge,
  "sourceId" | "targetId" | "entityType" | "attributes"
> & {
  entityType: "patched-edge";
  /** Complete set of edge attributes fetched from the database */
  attributes: EntityProperties;
  /** Fully patched source vertex with all attributes */
  source: PatchedResultVertex;
  /** Fully patched target vertex with all attributes */
  target: PatchedResultVertex;
};

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
    type: createEdgeType(options.type),
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
    entityType: "patched-edge",
    id: createEdgeId(options.id),
    type: createEdgeType(options.type),
    source: createPatchedResultVertex({
      ...options.sourceVertex,
      isBlankNode: options.sourceVertex.isBlankNode,
      name: "source",
    }),
    target: createPatchedResultVertex({
      ...options.targetVertex,
      isBlankNode: options.targetVertex.isBlankNode,
      name: "target",
    }),
    attributes: options.attributes ?? {},
    ...(options.name ? { name: options.name } : {}),
  };
}
