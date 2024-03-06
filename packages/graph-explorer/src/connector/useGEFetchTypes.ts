import { Edge, Vertex } from "../@types/entities";
import { ConfigurationContextProps, EdgeTypeConfig, VertexTypeConfig } from "../core";

export type QueryOptions =
    RequestInit
    & {
        disableCache?: boolean;
        queryId?: string;
        successCallback?: any;
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
    /**
     * Only return exact attribute value matches.
     */
    exactMatch?: boolean;
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

export type CacheItem = {
    updatedAt: number;
    data: any;
};