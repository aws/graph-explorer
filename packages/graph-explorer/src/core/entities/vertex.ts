import { Branded, LABELS } from "@/utils";
import { EntityProperties, EntityRawId } from "./shared";
import { createVertexId } from "./entityIdType";

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
  const givenTypes = options.types ?? [];
  const types = givenTypes.length > 0 ? givenTypes : [LABELS.MISSING_TYPE];
  return {
    id: createVertexId(options.id),
    type: types[0],
    types,
    attributes: options.attributes != null ? options.attributes : {},
    isBlankNode: options.isBlankNode ?? false,
  };
}
