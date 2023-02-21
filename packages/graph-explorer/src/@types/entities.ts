export interface VertexData {
  /**
   * Unique identifier for the vertex.
   * - For PG, the node id
   * - For RDF, the resource URI
   */
  id: string;
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
  types?: string[];
  /**
   * List of attributes associated to the vertex.
   * - For PG, nodes can contain attributes.
   * - For RDF, subjects can be connected to other subjects which are literals
   */
  attributes: Record<string, string | number>;
  /**
   * The total number of neighbors.
   * - For PG, all connected nodes independently of their direction (in/out)
   * - For RDF, all subjects which be compliant with:
   *   1. <resourceURI> ?pred ?subject
   *   2. ?subject ?pred <resourceURI>
   *   3. FILTER(!isLiteral(?subject))
   */
  neighborsCount: number;
  /**
   * The total number of neighbors by type.
   */
  neighborsCountByType: Record<string, number>;

  // The following properties are computed on run-time
  /**
   * Internal flag to mark the resource as blank node in RDF.
   */
  __isBlank?: boolean;
  /**
   * Total number of non-fetched neighbors
   */
  __unfetchedNeighborCount?: number;
  /**
   * Non-fetched neighbors by type
   */
  __unfetchedNeighborCounts?: Record<string, number>;
  /**
   * Fetched incoming edges connected with the vertex
   */
  __fetchedInEdgeCount?: number;
  /**
   * Fetched outgoing edges connected with the vertex
   */
  __fetchedOutEdgeCount?: number;
}

/**
 * Sometimes is needed to add some extra properties to a Vertex
 * which cannot be mixed or overwritten with the original data
 * of a vertex.
 * For example, NodesTabular add __is_visible property to hide/show a node.
 */
export type Vertex<T = Record<string, unknown>> = T & {
  data: VertexData;
};

export interface EdgeData {
  /**
   * Unique identifier for the edge.
   * - For PG, the edge id
   * - For RDF, predicates do not have ids like PG graphs.
   *   So, a synthetic id is created using <source URI>-[predicate]-><target URI>
   */
  id: string;
  /**
   * Edge type.
   * - For PG, the label which identifies the relation type
   * - For RDF, the predicate
   */
  type: string;
  /**
   * Source vertex id
   */
  source: string;
  /**
   * Source vertex type
   */
  sourceType: string;
  /**
   * Target vertex id
   */
  target: string;
  /**
   * Target vertex type
   */
  targetType: string;
  /**
   * Only for PG, attributes associated to the edge.
   * For RDF, predicates do not have more properties than the predicate itself.
   */
  attributes: Record<string, string | number>;
}

/**
 * Sometimes is needed to add some extra properties to an Edge
 * which cannot be mixed or overwritten with the original data
 * of en edge.
 * For example, EdgesTabular add __is_visible property to hide/show an edge.
 */
export interface Edge<T = Record<string, unknown>> {
  data: EdgeData & T;
}
