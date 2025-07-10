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
  bulkNeighborCounts: async () => ({ counts: [] }),
  fetchNeighborsCount: async req => {
    return {
      vertexId: req.vertexId,
      totalCount: 0,
      counts: {},
    };
  },
  keywordSearch: async () => toMappedQueryResults({}),
  vertexDetails: async () => ({ vertices: [] }),
  edgeDetails: async () => ({ edges: [] }),
  rawQuery: async () => toMappedQueryResults({}),
};
