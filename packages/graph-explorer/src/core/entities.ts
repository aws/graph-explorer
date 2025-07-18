import { Branded } from "@/utils";

export type EntityRawId = string | number;
export type EdgeId = Branded<EntityRawId, "EdgeId">;
export type VertexId = Branded<EntityRawId, "VertexId">;

export type EntityPropertyValue = string | number | boolean;
export type EntityProperties = Record<string, EntityPropertyValue>;

export type Vertex = {
  /**
   * Indicates the type in order to discriminate from the `Edge` type in unions.
   */
  entityType: "vertex";
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
   * In gremlin, a node can have multiple labels (types).
   * So, this stores all possible labels for displaying purposes.
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

  // The following properties are computed on run-time
  /**
   * Sometimes the vertex response does not include the properties, so this flag
   * indicates that another query must be executed to get the properties.
   */
  __isFragment: boolean;
  /**
   * Internal flag to mark the resource as blank node in RDF.
   */
  __isBlank: boolean;
};

export type Edge = {
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
   * Edge type.
   * - For PG, the label which identifies the relation type
   * - For RDF, the predicate
   */
  type: string;
  /**
   * Source vertex id
   */
  source: VertexId;
  /**
   * Source vertex types
   */
  sourceTypes: Vertex["types"];
  /**
   * Target vertex id
   */
  target: VertexId;
  /**
   * Target vertex types
   */
  targetTypes: Vertex["types"];
  /**
   * Only for PG, attributes associated to the edge.
   * For RDF, predicates do not have more properties than the predicate itself.
   */
  attributes: EntityProperties;

  /**
   * Sometimes the edge response does not include the properties, so this flag
   * indicates that another query must be executed to get the properties.
   */
  __isFragment: boolean;
};

export type Entities = {
  nodes: Map<VertexId, Vertex>;
  edges: Map<EdgeId, Edge>;
};
