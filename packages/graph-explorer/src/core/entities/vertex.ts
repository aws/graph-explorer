import { type Branded, LABELS } from "@/utils";

import type { EntityProperties, EntityRawId } from "./shared";

import { createVertexId } from "./entityIdType";

/**
 * A branded type for vertex identifiers to ensure type safety.
 *
 * This prevents accidental mixing of vertex IDs with other entity IDs
 * at compile time.
 */
export type VertexId = Branded<EntityRawId, "VertexId">;

/** Represents the vertex label or RDF class */
export type VertexType = Branded<string, "VertexType">;

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
   * The primary vertex type, used to drive styling and naming.
   * - For PG, the node label
   * - For RDF, the resource class
   *
   * When a node carries several labels, this is the most specific one: the
   * generic `vertex` base label is skipped unless it is the only label.
   */
  type: VertexType;

  /**
   * In gremlin, a node can have multiple labels (types). So, this stores all
   * possible labels for displaying purposes.
   * @example
   * "John Doe" can be a "person" and a "worker"
   * types = ["person", "worker"]
   */
  types: VertexType[];

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
   * The primary type (used for styling and naming) is the first specific label
   * in the array, skipping the generic `vertex` base label unless it is the
   * only label. If no types are provided, the vertex falls back to a single
   * "missing type" label.
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
  const types = (
    givenTypes.length > 0 ? givenTypes : [LABELS.MISSING_TYPE]
  ) as VertexType[];
  return {
    id: createVertexId(options.id),
    type: selectPrimaryType(types),
    types,
    attributes: options.attributes != null ? options.attributes : {},
    isBlankNode: options.isBlankNode ?? false,
  };
}

/** The default label Gremlin/TinkerPop assigns to a vertex created without one. */
const GENERIC_VERTEX_LABEL = "vertex";

/**
 * Picks the type that drives a vertex's styling and naming. The generic
 * `vertex` base label (matched case-insensitively) is skipped when a more
 * specific label exists, so a node labeled `["vertex", "sqsqueue"]` is styled
 * and named as `sqsqueue`. A vertex whose only label is `vertex` keeps it.
 */
function selectPrimaryType(types: VertexType[]): VertexType {
  return (
    types.find(type => type.toLowerCase() !== GENERIC_VERTEX_LABEL) ?? types[0]
  );
}

/** Creates a VertexType from a string */
export function createVertexType(type: string): VertexType {
  return type as VertexType;
}
