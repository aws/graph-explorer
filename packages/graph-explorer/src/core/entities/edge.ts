import { Branded } from "@/utils";
import { PatchedResultVertex, VertexId } from "./vertex";
import { EntityProperties, EntityRawId } from "./shared";

export type EdgeId = Branded<EntityRawId, "EdgeId">;

export type Edge = {
  /**
   * Unique identifier for the edge.
   * - For PG, the edge id
   * - For RDF, predicates do not have ids like PG graphs.
   *   So, a synthetic id is created using <source URI>-[predicate]-><target URI>
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
   * Only for PG, attributes associated to the edge.
   * For RDF, predicates do not have more properties than the predicate itself.
   */
  attributes: EntityProperties;
};

/** An edge result from a graph database query */
export type ResultEdge = {
  /**
   * Indicates the type in order to discriminate from the `Vertex` type in unions.
   */
  entityType: "edge";
  /**
   * Unique identifier for the edge.
   * - For PG, the edge id
   * - For RDF, predicates do not have ids like PG graphs.
   *   So, a synthetic id is created using <source URI>-[predicate]-><target URI>
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
   * Only for PG, attributes associated to the edge. If it is null the edge is assumed to be a fragment.
   * For RDF, predicates do not have more properties than the predicate itself.
   */
  attributes?: EntityProperties;
};

/**
 * A edge result after it has been patched with the full edge details, including
 * the patched vertex results for source and target.
 */
export type PatchedResultEdge = Omit<ResultEdge, "sourceId" | "targetId"> & {
  attributes: EntityProperties;
  sourceVertex: PatchedResultVertex;
  targetVertex: PatchedResultVertex;
};
