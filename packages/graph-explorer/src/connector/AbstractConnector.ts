import localforage from "localforage";
import type { Edge, Vertex } from "../@types/entities";
import type {
  ConfigurationContextProps,
  EdgeTypeConfig,
  VertexTypeConfig,
} from "../core";

export type QueryOptions = {
  abortSignal?: AbortSignal;
  disableCache?: boolean;
};

export type VertexSchemaResponse = Pick<
  VertexTypeConfig,
  | "type"
  | "displayLabel"
  | "attributes"
  | "displayNameAttribute"
  | "longDisplayNameAttribute"
> & {
  total?: number;
};

export type CountsByTypeRequest = {
  label: string;
};
export type CountsByTypeResponse = {
  total: number;
};

export type EdgeSchemaResponse = Pick<
  EdgeTypeConfig,
  "type" | "displayLabel" | "attributes"
> & {
  total?: number;
};

export type SchemaResponse = {
  /**
   * Total number of vertices.
   */
  totalVertices?: number;
  /**
   * List of vertices definitions.
   */
  vertices: VertexSchemaResponse[];
  /**
   * Total number of edges.
   */
  totalEdges?: number;
  /**
   * List of edges definitions.
   */
  edges: EdgeSchemaResponse[];
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

// 10 minutes
const CACHE_TIME_MS = 10 * 60 * 1000;
type CacheItem = {
  updatedAt: number;
  data: any;
};

const localforageCache = localforage.createInstance({
  name: "ge",
  version: 1.0,
  storeName: "connector-cache",
});

export abstract class AbstractConnector {
  protected readonly _connection: ConfigurationWithConnection["connection"];

  protected abstract readonly basePath: string;

  public constructor(connection: ConfigurationWithConnection["connection"]) {
    if (!connection?.url) {
      throw new Error("Invalid configuration. Missing 'connection.url'");
    }

    this._connection = connection;
  }

  /**
   * Fetch all vertices and edges types (name, data type, attributes, ...)
   */
  public abstract fetchSchema(options?: QueryOptions): Promise<SchemaResponse>;

  /**
   * Count the number of vertices of a given type
   */
  public abstract fetchVertexCountsByType(
    req: CountsByTypeRequest,
    options?: QueryOptions
  ): Promise<CountsByTypeResponse>;

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

  /**
   * This method performs requests and cache their responses.
   */
  protected async requestQueryTemplate<TResult = any>(
    queryTemplate: string,
    options?: { signal?: AbortSignal; disableCache?: boolean }
  ): Promise<TResult> {
    const encodedQuery = encodeURIComponent(queryTemplate);
    const uri = `${this.basePath}${encodedQuery}&format=json`;
    return this.request<TResult>(uri, options);
  }

  protected async request<TResult = any>(
    uri: string,
    options?: { signal?: AbortSignal; disableCache?: boolean }
  ): Promise<TResult> {
    const url = this._connection.url.replace(/\/$/, "");
    const currentUri = `${url}${uri}`;

    const cachedResponse = await this._getFromCache(currentUri);
    if (
      cachedResponse &&
      cachedResponse.updatedAt +
        (this._connection.cacheTimeMs ?? CACHE_TIME_MS) >
        new Date().getTime()
    ) {
      return cachedResponse.data;
    }

    return this._requestAndCache<TResult>(currentUri, {
      signal: options?.signal,
      headers: this._getAuthHeaders(),
    });
  }

  private _getAuthHeaders() {
    const headers: HeadersInit = {};
    if (this._connection?.proxyConnection) {
      headers["graph-db-connection-url"] = this._connection?.graphDbUrl || "";
    }
    if (this._connection?.awsAuthEnabled) {
      headers["aws-neptune-region"] = this._connection?.awsRegion || "";
    }

    return headers;
  }

  private async _requestAndCache<TResult = any>(
    url: string,
    init?: RequestInit,
    options?: Pick<QueryOptions, "disableCache">
  ) {
    const response = await fetch(url, init);
    const data = await response.json();
    if (options?.disableCache !== true) {
      this._setToCache(url, { data, updatedAt: new Date().getTime() });
    }
    return data as TResult;
  }

  private _getFromCache(key: string) {
    if (!this._connection.enableCache) {
      return;
    }

    return localforageCache.getItem(key) as Promise<CacheItem | undefined>;
  }

  private _setToCache(key: string, value: CacheItem) {
    if (!this._connection.enableCache) {
      return;
    }

    return localforageCache.setItem(key, value);
  }
}
