/* eslint-disable @typescript-eslint/require-await */
import { Explorer } from "./useGEFetchTypes";

/**
 * Empty explorer for when there is no connection.
 */
export const emptyExplorer: Explorer = {
  connection: {
    url: "",
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
  fetchNeighbors: async () => {
    return {
      vertices: [],
      edges: [],
      scalars: [],
    };
  },
  fetchNeighborsCount: async () => {
    return {
      totalCount: 0,
      counts: {},
    };
  },
  keywordSearch: async () => {
    return {
      vertices: [],
      edges: [],
      scalars: [],
    };
  },
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
  rawQuery: async () => {
    return {
      vertices: [],
      edges: [],
      scalars: [],
    };
  },
};
