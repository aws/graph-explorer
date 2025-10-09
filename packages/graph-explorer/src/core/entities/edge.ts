import { type Branded } from "@/utils";
import { type VertexId } from "./vertex";
import { type EntityProperties, type EntityRawId } from "./shared";
import { createEdgeId, createVertexId } from "./entityIdType";

/**
 * A branded type for edge identifiers to ensure type safety.
 *
 * This prevents accidental mixing of edge IDs with other entity IDs
 * at compile time.
 */
export type EdgeId = Branded<EntityRawId, "EdgeId">;

/**
 * An edge in a graph database.
 *
 * This type is used throughout the Graph Explorer UI to represent an edge in
 * the graph. It is guaranteed to be fully materialized with all properties.
 */
export type Edge = {
  /**
   * Unique identifier for the edge.
   * - For PG, the edge id
   * - For RDF, predicates do not have ids like PG graphs. So, a synthetic id is
   *   created using <source URI>-[predicate]-><target URI>
   */
  id: EdgeId;
  /**
   * Edge type.
   * - For PG, the label which identifies the relation type
   * - For RDF, the predicate
   */
  type: string;
  /**
   * Source vertex id
   */
  sourceId: VertexId;
  /**
   * Target vertex id
   */
  targetId: VertexId;
  /**
   * Only for PG, attributes associated to the edge. For RDF, predicates do not
   * have more properties than the predicate itself.
   */
  attributes: EntityProperties;
};

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
