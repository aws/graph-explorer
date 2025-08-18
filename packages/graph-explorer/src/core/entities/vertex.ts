import { Branded } from "@/utils";
import { EntityProperties, EntityRawId } from "./shared";

/**
 * A branded type for vertex identifiers to ensure type safety.
 *
 * This prevents accidental mixing of vertex IDs with other entity IDs
 * at compile time.
 */
export type VertexId = Branded<EntityRawId, "VertexId">;

/**
 * A vertex in a graph database.
 *
 * This type is used through out the Graph Explorer UI to represent a vertex in
 * the graph. It is guaranteed to be fully materialized.
 */
export type Vertex = {
  /**
   * Unique identifier for the vertex.
   * - For PG, the node id
   * - For RDF, the resource URI
   */
  id: VertexId;

  /**
   * Single vertex type.
   * - For PG, the node label
   * - For RDF, the resource class
   */
  type: string;

  /**
   * In gremlin, a node can have multiple labels (types). So, this stores all
   * possible labels for displaying purposes.
   * @example
   * "John Doe" can be a "person" and a "worker"
   * types = ["person", "worker"]
   */
  types: string[];

  /**
   * List of attributes associated to the vertex.
   * - For PG, nodes can contain attributes.
   * - For RDF, subjects can be connected to other subjects which are literals
   */
  attributes: EntityProperties;

  /**
   * Internal flag to mark the resource as blank node in RDF.
   */
  isBlankNode: boolean;
};

/**
 * A vertex result from a graph database query.
 *
 * If the attributes are not defined, the vertex is assumed to be a fragment and
 * will have their details fetched from the database.
 */
export type ResultVertex = {
  /**
   * Indicates the type in order to discriminate from other result types in
   * unions.
   */
  entityType: "vertex";

  /**
   * Unique identifier for the vertex.
   * - For PG, the node id
   * - For RDF, the resource URI
   */
  id: VertexId;

  /**
   * The name of the vertex in the original result set.
   */
  name?: string;

  /**
   * In gremlin, a node can have multiple labels (types). So, this stores all
   * possible labels for displaying purposes.
   * @example
   * "John Doe" can be a "person" and a "worker"
   * types = ["person", "worker"]
   */
  types: string[];

  /**
   * List of attributes associated to the vertex. If it is undefined the vertex
   * is assumed to be a fragment.
   */
  attributes?: EntityProperties;

  /**
   * Flag to mark the resource as blank node in RDF.
   */
  isBlankNode: boolean;
};

/**
 * A vertex result after it has been patched with the full vertex details.
 *
 * This type represents a `ResultVertex` that has been enriched with complete
 * attribute data fetched from the database. The `attributes` property is
 * guaranteed to be present and fully populated.
 */
export type PatchedResultVertex = ResultVertex & {
  /** Complete set of vertex attributes fetched from the database */
  attributes: EntityProperties;
};
