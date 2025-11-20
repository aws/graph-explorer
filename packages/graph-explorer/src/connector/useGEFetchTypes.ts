import type {
  ConfigurationContextProps,
  EdgeTypeConfig,
  VertexTypeConfig,
  Edge,
  EdgeId,
  Vertex,
  VertexId,
  NormalizedConnection,
  Entities,
} from "@/core";
import type { ResultEntity } from "./entities";

export type QueryOptions = RequestInit & {
  queryId?: string;
};

export type VertexSchemaResponse = Pick<
  VertexTypeConfig,
  "type" | "attributes" | "displayNameAttribute" | "longDisplayNameAttribute"
> & {
  total?: number;
};

export type CountsByTypeRequest = {
  label: string;
};
export type CountsByTypeResponse = {
  total: number;
};

export type EdgeSchemaResponse = Pick<EdgeTypeConfig, "type" | "attributes"> & {
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

/**
 * A request for the neighbors and relationships for the given vertex, filtered
 * by the provided paramters.
 */
export type NeighborsRequest = {
  /**
   * Source vertex ID & type.
   */
  vertexId: VertexId;

  /**
   * Vertices to exclude from the results.
   *
   * Useful to exclude vertices already in the graph.
   */
  excludedVertices?: Set<VertexId>;

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

/**
 * A response with the neighbors and relationships for a given `NeighborsRequest`.
 *
 * All vertices and edges are fully materialized.
 */
export type NeighborsResponse = Entities;

export type NeighborCountsRequest = {
  /**
   * Source vertex ID & type.
   */
  vertexIds: VertexId[];
};

export type NeighborCount = {
  vertexId: VertexId;
  /**
   * Number of connected vertices.
   */
  totalCount: number;
  /**
   * Number of connected vertices by vertex type.
   */
  counts: {
    [vertexType: string]: number;
  };
};

export type NeighborCountsResponse = {
  counts: Array<NeighborCount>;
};

export type KeywordSearchRequest = {
  /**
   * Search term to match with vertices attributes
   */
  searchTerm?: string;
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
  /**
   * Only return exact attribute value matches.
   */
  exactMatch?: boolean;
};

export type KeywordSearchResponse = { vertices: Vertex[] };

export type ErrorResponse = {
  code: string;
  detailedMessage: string;
};

export type ConfigurationWithConnection = Omit<
  ConfigurationContextProps,
  "connection"
> &
  Required<Pick<ConfigurationContextProps, "connection">>;

export type ExplorerRequestOptions = RequestInit & {
  queryId?: string;
};

export type VertexDetailsRequest = {
  vertexIds: VertexId[];
};

export type VertexDetailsResponse = {
  vertices: Vertex[];
};

export type EdgeDetailsRequest = {
  edgeIds: EdgeId[];
};

export type EdgeDetailsResponse = {
  edges: Edge[];
};

export type RawQueryRequest = {
  query: string;
};

export type RawQueryResponse = {
  results: ResultEntity[];
  rawResponse: unknown;
};

/**
 * Abstracted interface to the common database queries used by
 * Graph Explorer.
 */
export type Explorer = {
  connection: NormalizedConnection;
  fetchSchema: (options?: ExplorerRequestOptions) => Promise<SchemaResponse>;
  fetchVertexCountsByType: (
    req: CountsByTypeRequest,
    options?: ExplorerRequestOptions,
  ) => Promise<CountsByTypeResponse>;
  fetchNeighbors: (
    req: NeighborsRequest,
    options?: ExplorerRequestOptions,
  ) => Promise<NeighborsResponse>;
  neighborCounts: (
    req: NeighborCountsRequest,
    options?: ExplorerRequestOptions,
  ) => Promise<NeighborCountsResponse>;
  keywordSearch: (
    req: KeywordSearchRequest,
    options?: ExplorerRequestOptions,
  ) => Promise<KeywordSearchResponse>;
  vertexDetails: (
    req: VertexDetailsRequest,
    options?: ExplorerRequestOptions,
  ) => Promise<VertexDetailsResponse>;
  edgeDetails: (
    req: EdgeDetailsRequest,
    options?: ExplorerRequestOptions,
  ) => Promise<EdgeDetailsResponse>;
  rawQuery: (
    req: RawQueryRequest,
    options?: ExplorerRequestOptions,
  ) => Promise<RawQueryResponse>;
};
