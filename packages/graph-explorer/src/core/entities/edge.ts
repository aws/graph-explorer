import { Branded } from "@/utils";
import { PatchedResultVertex, VertexId } from "./vertex";
import { EntityProperties, EntityRawId } from "./shared";

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
export type PatchedResultEdge = Omit<ResultEdge, "sourceId" | "targetId"> & {
  /** Complete set of edge attributes fetched from the database */
  attributes: EntityProperties;
  /** Fully patched source vertex with all attributes */
  sourceVertex: PatchedResultVertex;
  /** Fully patched target vertex with all attributes */
  targetVertex: PatchedResultVertex;
};
