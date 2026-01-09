import {
  createVertexId,
  type EntityProperties,
  type EntityRawId,
  type VertexId,
  type VertexType,
} from "@/core";

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
  types: VertexType[];

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
export type PatchedResultVertex = Omit<
  ResultVertex,
  "entityType" | "attributes"
> & {
  entityType: "patched-vertex";
  /** Complete set of vertex attributes fetched from the database */
  attributes: EntityProperties;
};

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
    ...(options.name ? { name: options.name } : {}),
    types: (options.types as VertexType[]) ?? [],
    ...(options.attributes ? { attributes: options.attributes } : {}),
    isBlankNode: options.isBlankNode ?? false,
  };
}

/**
 * Creates a PatchedResultVertex instance from the given options.
 */
export function createPatchedResultVertex(options: {
  id: EntityRawId;
  types: string[];
  attributes: EntityProperties;

  /** If not provided, then defaults to false. */
  isBlankNode?: boolean;

  /**
   * The name of the vertex provided in the query result set. This is mainly just
   * useful for user queries.
   */
  name?: string;
}): PatchedResultVertex {
  return {
    entityType: "patched-vertex",
    id: createVertexId(options.id),
    types: options.types as VertexType[],
    attributes: options.attributes,
    isBlankNode: options.isBlankNode ?? false,
    ...(options.name ? { name: options.name } : {}),
  };
}
