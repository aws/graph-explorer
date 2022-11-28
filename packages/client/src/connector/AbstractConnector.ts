import isEqual from "lodash/isEqual";
import type { Edge, Vertex } from "../@types/entities";
import type {
  ConfigurationContextProps,
  EdgeTypeConfig,
  PrefixTypeConfig,
  VertexTypeConfig,
} from "../core";

export type QueryOptions = {
  abortSignal?: AbortSignal;
};

export type VertexSchemaResponse = Pick<
  VertexTypeConfig,
  | "type"
  | "displayLabel"
  | "attributes"
  | "displayNameAttribute"
  | "longDisplayNameAttribute"
> & {
  total: number;
};

export type EdgeSchemaResponse = Pick<
  EdgeTypeConfig,
  "type" | "displayLabel" | "attributes"
> & {
  total: number;
};

export type SchemaResponse = {
  /**
   * List of vertices definitions.
   */
  vertices: VertexSchemaResponse[];
  /**
   * List of edges definitions.
   */
  edges: EdgeSchemaResponse[];
  /**
   * List of automatically generated prefixes.
   */
  prefixes?: PrefixTypeConfig[];
};

export type Criterion = {
  /**
   * Attribute name.
   */
  name: string;
  /**
   * Operator value =, >=, LIKE, ...
   */
  operator: string;
  /**
   * Filter value.
   */
  value: any;
  /**
   * Attribute data type.
   * By default, String.
   */
  dataType?: "String" | "Number" | "Date";
};

export type NeighborsRequest = {
  /**
   * Source vertex ID.
   */
  vertexId: string;
  /**
   * Source vertex type.
   */
  vertexType: string;
  /**
   * Filter by vertex types.
   */
  filterByVertexTypes?: Array<string>;
  /**
   * Filter by edge types.
   */
  edgeTypes?: Array<string>;
  /**
   * Filter by vertex attributes.
   */
  filterCriteria?: Array<Criterion>;
  /**
   * Limit the number of results.
   * 0 = No limit.
   */
  limit?: number;
  /**
   * Skip the given number of results.
   */
  offset?: number;
};

export type NeighborsResponse = {
  /**
   * List of vertices.
   */
  vertices: Array<Vertex>;
  /**
   * List of edges.
   */
  edges: Array<Edge>;
};

export type NeighborsCountRequest = {
  /**
   * Source vertex ID.
   */
  vertexId: string;
  /**
   * Limit the number of results.
   * 0 = No limit.
   */
  limit?: number;
};

export type NeighborsCountResponse = {
  /**
   * Number of connected vertices.
   */
  totalCount: number;
  /**
   * Number of connected vertices by vertex type.
   */
  counts: { [vertexType: string]: number };
};

export type KeywordSearchRequest = {
  /**
   * Search term to match with vertices attributes
   */
  searchTerm?: string;
  /**
   * Include the Node ID in the attributes
   */
  searchById?: boolean;
  /**
   * Filter by attribute names.
   */
  searchByAttributes?: Array<string>;
  /**
   * Filter by vertex types.
   */
  vertexTypes?: Array<string>;
  /**
   * Limit the number of results.
   * 0 = No limit.
   */
  limit?: number;
  /**
   * Skip the given number of results.
   */
  offset?: number;
};

export type KeywordSearchResponse = {
  /**
   * List of vertices.
   */
  vertices: Array<Vertex>;
  /**
   * List of automatically generated prefixes.
   */
  prefixes?: PrefixTypeConfig[];
};

export type ErrorResponse = {
  code: string;
  detailedMessage: string;
};

export type ConfigurationWithConnection = Omit<
  ConfigurationContextProps,
  "connection"
> &
  Required<Pick<ConfigurationContextProps, "connection">>;

export abstract class AbstractConnector {
  protected readonly _config: ConfigurationWithConnection;

  public constructor(config: ConfigurationContextProps) {
    if (!config.connection?.url) {
      throw new Error("Invalid configuration. Missing 'connection.url'");
    }

    this._config = config as ConfigurationWithConnection;
  }

  public isConfigEqual(config: ConfigurationContextProps) {
    return isEqual(config, this._config);
  }

  /**
   * Fetch all vertices and edges types (name, data type, attributes, ...)
   */
  public abstract fetchSchema(options?: QueryOptions): Promise<SchemaResponse>;

  /**
   * Fetch all directly connected neighbors of a given source
   * filtered by vertex or edge types and/or vertex attributes.
   */
  public abstract fetchNeighbors(
    req: NeighborsRequest,
    options?: QueryOptions
  ): Promise<NeighborsResponse>;

  /**
   * Count all connected vertices by type of the given source.
   */
  public abstract fetchNeighborsCount(
    req: NeighborsCountRequest,
    options?: QueryOptions
  ): Promise<NeighborsCountResponse>;

  /**
   * Search vertices by matching keyword.
   * It tries to match the searched term with all the attributes in the list.
   */
  public abstract keywordSearch(
    req: KeywordSearchRequest,
    options?: QueryOptions
  ): Promise<KeywordSearchResponse>;
}
