import {
  EdgePreferences,
  VertexPreferences,
} from "../StateProvider/userPreferences";

export type AttributeConfig = {
  /**
   * Name of the attribute in the DB schema
   */
  name: string;
  /**
   * Name to be printed
   */
  displayLabel: string;
  /**
   * If hidden is true, the attribute won't be rendered
   */
  hidden?: boolean;
  /**
   * DB data type
   */
  dataType?: string;
  /**
   * For searching purposes, attributes can be enabled or disable
   * from the search request
   */
  searchable?: boolean;
};

export type VertexTypeConfig = {
  /**
   * Vertex type name's in the DB schema
   */
  type: string;
  /**
   * Name to be printed
   */
  displayLabel?: string;
  /**
   * Optional icon to be rendered inside the graph viewer and
   * other modules.
   */
  iconUrl?: string;
  /**
   * Vertex attribute to be used as label
   */
  displayNameAttribute?: string;
  /**
   * Vertex attribute to be used as description
   */
  longDisplayNameAttribute?: string;
  /**
   * If hidden is true, vertices of this types won't be rendered
   */
  hidden?: boolean;
  /**
   * List of attributes for the vertex type
   */
  attributes: Array<AttributeConfig>;
  /**
   * Total number of vertices of this type
   */
  total?: number;
} & VertexPreferences;

export type EdgeTypeConfig = {
  /**
   * Edge type name's in the DB schema
   */
  type: string;
  /**
   * Name to be printed
   */
  displayLabel?: string;
  /**
   * Vertex attribute to be used as label
   */
  displayNameAttribute?: string;
  /**
   * If hidden is true, edges of this types won't be rendered
   */
  hidden?: boolean;
  /**
   * List of attributes for the edge type
   */
  attributes: Array<Omit<AttributeConfig, "searchable">>;
  /**
   * Total number of edges of this type
   */
  total?: number;
} & EdgePreferences;

export type PrefixTypeConfig = {
  prefix: string;
  /**
   * Full URI for the prefix
   */
  uri: string;
  /**
   * Internal purpose only.
   * Mark as true after inferring from the schema.
   */
  __inferred?: boolean;
  /**
   * Internal purpose only.
   * Matches URIs
   */
  __matches?: Set<string>;
};

export type RawConfiguration = {
  /**
   * Unique identifier for this config
   */
  id: string;
  displayLabel?: string;
  /**
   * Allow to fetch the configuration from a given URL.
   * This will be merged with the rest of configuration with
   * a higher priority.
   */
  remoteConfigFile?: string;
  /**
   * Neptune connection configuration
   */
  connection?: {
    /**
     * Choose between gremlin or sparQL engines.
     * By default, it uses gremlin
     */
    queryEngine?: "gremlin" | "sparql";
    /**
     * Base URL to access to the database through HTTPs endpoints
     */
    url: string;
  };
  /**
   * Database schema: types, names, labels, icons, ...
   */
  schema?: {
    vertices: Array<VertexTypeConfig>;
    edges: Array<EdgeTypeConfig>;
    lastUpdate?: Date;
    triedToSync?: boolean;
    lastSyncFail?: boolean;
    /**
     * List of RDF prefixes (only for SPARQL)
     */
    prefixes?: Array<PrefixTypeConfig>;
  };
  /**
   * Mark as created from a file
   */
  __fileBase?: boolean;
};

export type ConfigurationContextProps = RawConfiguration & {
  vertexTypes: Array<string>;
  edgeTypes: Array<string>;
  getVertexTypeConfig(vertexType: string): VertexTypeConfig | undefined;
  getVertexTypeAttributes(vertexTypes: string[]): Array<AttributeConfig>;
  getVertexTypeSearchableAttributes(vertexType: string): Array<AttributeConfig>;
  getEdgeTypeConfig(edgeType: string): EdgeTypeConfig | undefined;
};
