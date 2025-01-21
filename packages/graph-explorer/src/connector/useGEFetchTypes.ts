import {
  ConfigurationContextProps,
  EdgeTypeConfig,
  VertexTypeConfig,
} from "@/core";
import { ConnectionConfig } from "@shared/types";
import { MappedQueryResults } from "./gremlin/mappers/mapResults";
import {
  Edge,
  EdgeId,
  Vertex,
  VertexId,
  EntityIdType,
} from "@/@types/entities";

export type QueryOptions = RequestInit & {
  queryId?: string;
};

export type VertexRef = {
  id: VertexId;
  idType: EntityIdType;
};

export type EdgeRef = {
  id: EdgeId;
  idType: EntityIdType;
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
   * Source vertex ID & type.
   */
  vertex: VertexRef;
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

export type NeighborsResponse = MappedQueryResults;

export type NeighborsCountRequest = {
  /**
   * Source vertex ID & type.
   */
  vertex: VertexRef;
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
  vertex: VertexRef;
};

export type VertexDetailsResponse = {
  vertex: Vertex | null;
};

export type EdgeDetailsRequest = {
  edge: EdgeRef;
};

export type EdgeDetailsResponse = {
  edge: Edge | null;
};

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
};
