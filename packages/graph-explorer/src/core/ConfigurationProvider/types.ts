import {
  EdgePreferences,
  VertexPreferences,
} from "@/core/StateProvider/userPreferences";
import { ConnectionConfig } from "@shared/types";

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

export type Schema = {
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

export type RawConfiguration = {
  /**
   * Unique identifier for this config
   */
  id: string;
  displayLabel?: string;
  /**
   * Connection configuration
   */
  connection?: ConnectionConfig;
  /**
   * Database schema: types, names, labels, icons, ...
   */
  schema?: Schema;
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
};
