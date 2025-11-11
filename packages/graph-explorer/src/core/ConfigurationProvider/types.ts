import type {
  EdgePreferencesStorageModel,
  VertexPreferencesStorageModel,
} from "@/core/StateProvider/userPreferences";
import type { Branded } from "@/utils";
import type { ConnectionConfig } from "@shared/types";
import { v4 } from "uuid";

export type ConfigurationId = Branded<string, "ConfigurationId">;

export function createNewConfigurationId() {
  return v4() as ConfigurationId;
}

export type AttributeConfig = {
  /**
   * Name of the attribute in the DB schema
   */
  name: string;

  /**
   * DB data type
   */
  dataType?: string;
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
} & VertexPreferencesStorageModel;

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
  attributes: Array<AttributeConfig>;
  /**
   * Total number of edges of this type
   */
  total?: number;
} & EdgePreferencesStorageModel;

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
  id: ConfigurationId;
  displayLabel?: string;
  /**
   * Connection configuration
   */
  connection?: ConnectionConfig;
  /**
   * Database schema: types, names, labels, icons, ...
   */
  schema?: Schema;
};

export type ConfigurationContextProps = RawConfiguration & {
  totalVertices: number;
  vertexTypes: Array<string>;
  totalEdges: number;
  edgeTypes: Array<string>;
};

/**
 * Represents a connection config with the ID and display label integrated in to
 * the type.
 *
 * This makes it a bit easier to deal with compared to the connection inside the
 * `RawConfiguration` type since that one has a bunch of other properties and
 * the connection is optional.
 */
export type ConnectionWithId = ConnectionConfig & {
  id: ConfigurationId;
  displayLabel?: string;
};
