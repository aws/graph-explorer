import { Branded } from "@/utils";
import { EntityProperties, EntityRawId } from "./shared";

export type VertexId = Branded<EntityRawId, "VertexId">;

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
   * Internal flag to mark the resource as blank node in RDF.
   */
  isBlankNode: boolean;
};

/** An edge result from a graph database query */
export type ResultVertex = {
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
   * The name of the vertex in the original result set.
   */
  name: string | null;

  /**
   * In gremlin, a node can have multiple labels (types).
   * So, this stores all possible labels for displaying purposes.
   * @example
   * "John Doe" can be a "person" and a "worker"
   * types = ["person", "worker"]
   */
  types: string[];
  /**
   * List of attributes associated to the vertex. If it is null the vertex is assumed to be a fragment.
   * - For PG, nodes can contain attributes.
   * - For RDF, subjects can be connected to other subjects which are literals
   */
  attributes: EntityProperties | null;
  /**
   * Flag to mark the resource as blank node in RDF.
   */
  isBlankNode: boolean;
};

/** A vertex result after it has been patched with the full vertex details. */
export type PatchedResultVertex = ResultVertex & {
  attributes: EntityProperties;
};
