import {
  ConfigurationContextProps,
  EdgeTypeConfig,
  VertexTypeConfig,
} from "@/core";
import { ConnectionConfig } from "@shared/types";
import { Edge, EdgeId, Vertex, VertexId } from "@/core";

export type QueryOptions = RequestInit & {
  queryId?: string;
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

export type ScalarValue = number | string | Date;

/**
 * Results from any query.
 *
 * Used by keyword search and raw query. Could potentially be used for other
 * queries in the future.
 */
export type MappedQueryResults = {
  vertices: Vertex[];
  edges: Edge[];
  scalars: ScalarValue[];
};

/** Constructs a `MappedQueryResults` instance without providing all values. */
export function toMappedQueryResults(
  value: Partial<MappedQueryResults>
): MappedQueryResults {
  return {
    vertices: value.vertices ?? [],
    edges: value.edges ?? [],
    scalars: value.scalars ?? [],
  };
}

export type NeighborsRequest = {
  /**
   * Source vertex ID & type.
   */
  vertexId: VertexId;
  /**
   * Source vertex types.
   *
   * Used only by the SPARQL implementation to patch the edges returned with the
   * source vertex type.
   *
   * NOTE: This should be removed once the SPARQL queries are updated to
   * retrieve the resource class from the database.
   */
  vertexTypes: Vertex["types"];
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

export type NeighborsResponse = MappedQueryResults;

export type NeighborsCountRequest = {
  /**
   * Source vertex ID & type.
   */
  vertexId: VertexId;
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

export type KeywordSearchResponse = MappedQueryResults;

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
  vertexId: VertexId;
};

export type VertexDetailsResponse = {
  vertex: Vertex | null;
};

export type EdgeDetailsRequest = {
  edgeId: EdgeId;
};

export type EdgeDetailsResponse = {
  edge: Edge | null;
};

export type RawQueryRequest = {
  query: string;
};

export type RawQueryResponse = MappedQueryResults;

/**
 * Abstracted interface to the common database queries used by
 * Graph Explorer.
 */
export type Explorer = {
  connection: ConnectionConfig;
  fetchSchema: (options?: ExplorerRequestOptions) => Promise<SchemaResponse>;
  fetchVertexCountsByType: (
    req: CountsByTypeRequest,
    options?: ExplorerRequestOptions
  ) => Promise<CountsByTypeResponse>;
  fetchNeighbors: (
    req: NeighborsRequest,
    options?: ExplorerRequestOptions
  ) => Promise<NeighborsResponse>;
  fetchNeighborsCount: (
    req: NeighborsCountRequest,
    options?: ExplorerRequestOptions
  ) => Promise<NeighborsCountResponse>;
  keywordSearch: (
    req: KeywordSearchRequest,
    options?: ExplorerRequestOptions
  ) => Promise<KeywordSearchResponse>;
  vertexDetails: (
    req: VertexDetailsRequest,
    options?: ExplorerRequestOptions
  ) => Promise<VertexDetailsResponse>;
  edgeDetails: (
    req: EdgeDetailsRequest,
    options?: ExplorerRequestOptions
  ) => Promise<EdgeDetailsResponse>;
  rawQuery: (
    req: RawQueryRequest,
    options?: ExplorerRequestOptions
  ) => Promise<RawQueryResponse>;
};
