/* oxlint-disable @typescript-eslint/require-await */
import type { Explorer } from "./useGEFetchTypes";

/**
 * Empty explorer for when there is no connection.
 */
export const emptyExplorer: Explorer = {
  // Spelled out rather than built with `normalizeConnection`, which would import
  // `@/core` and close a cycle back through the real explorers.
  connection: {
    url: "",
    graphDbUrl: "",
    queryEngine: "gremlin",
    proxyConnection: false,
    awsAuthEnabled: false,
    edgeConnectionDiscovery: "auto",
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
  fetchNeighbors: async () => ({ vertices: [], edges: [] }),
  neighborCounts: async () => ({ counts: [] }),
  keywordSearch: async () => ({ vertices: [] }),
  vertexDetails: async () => ({ vertices: [] }),
  edgeDetails: async () => ({ edges: [] }),
  rawQuery: async () => ({ results: [], rawResponse: null }),
  fetchEdgeConnections: async () => ({ edgeConnections: [] }),
};
