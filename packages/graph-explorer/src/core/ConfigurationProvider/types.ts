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

export type ConnectionConfig = {
  /**
   * Base URL to access to the database through HTTPs endpoints
   */
  url: string;
  /**
   * Choose between gremlin or sparQL engines.
   * By default, it uses gremlin
   */
  queryEngine?: "gremlin" | "sparql" | "openCypher";
  /**
   * If the service is Neptune,
   * all requests should be sent through the nodejs proxy-server.
   */
  proxyConnection?: boolean;
  /**
   * If it is Neptune, the URL of the database.
   */
  graphDbUrl?: string;
  /**
   * If it is Neptune, it could need authentication.
   */
  awsAuthEnabled?: boolean;
  /**
   * AWS Region where the Neptune cluster is deployed.
   * It is needed to sign requests.
   */
  awsRegion?: string;
  /**
   * Enable or disable connector cache.
   * By default, it's enabled.
   */
  enableCache?: boolean;
  /**
   * Number of milliseconds before expiring a cached request.
   * By default, 10 minutes.
   */
  cacheTimeMs?: number;
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
   * Connection configuration
   */
  connection?: ConnectionConfig;
  /**
   * Database schema: types, names, labels, icons, ...
   */
  schema?: {
    totalVertices: number;
    vertices: Array<VertexTypeConfig>;
    totalEdges: number;
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
  totalVertices: number;
  vertexTypes: Array<string>;
  totalEdges: number;
  edgeTypes: Array<string>;
  getVertexTypeConfig(vertexType: string): VertexTypeConfig | undefined;
  getVertexTypeAttributes(vertexTypes: string[]): Array<AttributeConfig>;
  getVertexTypeSearchableAttributes(vertexType: string): Array<AttributeConfig>;
  getEdgeTypeConfig(edgeType: string): EdgeTypeConfig | undefined;
};
