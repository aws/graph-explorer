/* eslint-disable @typescript-eslint/require-await */
import { Explorer, toMappedQueryResults } from "./useGEFetchTypes";

/**
 * Empty explorer for when there is no connection.
 */
export const emptyExplorer: Explorer = {
  connection: {
    url: "",
    graphDbUrl: "",
    queryEngine: "gremlin",
    proxyConnection: false,
    awsAuthEnabled: false,
  },
  fetchSchema: async () => {
    return {
      totalVertices: 0,
      vertices: [],
      totalEdges: 0,
      edges: [],
    };
  },
  fetchVertexCountsByType: async () => {
    return {
      total: 0,
    };
  },
  fetchNeighbors: async () => toMappedQueryResults({}),
  fetchNeighborsCount: async () => {
    return {
      totalCount: 0,
      counts: {},
    };
  },
  keywordSearch: async () => toMappedQueryResults({}),
  vertexDetails: async () => {
    return {
      vertex: null,
    };
  },
  edgeDetails: async () => {
    return {
      edge: null,
    };
  },
  rawQuery: async () => toMappedQueryResults({}),
  bulkVertexDetails: async () => ({ vertices: [] }),
};
