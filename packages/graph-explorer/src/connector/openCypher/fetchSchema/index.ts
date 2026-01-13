import type { LoggerConnector } from "@/connector/LoggerConnector";
import type { SchemaResponse } from "@/connector/useGEFetchTypes";

import {
  createEdge,
  createVertex,
  mapEdgeToTypeConfig,
  mapVertexToTypeConfigs,
} from "@/core";
import { batchPromisesSerially } from "@/utils";
import { DEFAULT_CONCURRENT_REQUESTS_LIMIT } from "@/utils/constants";

import type { OCEdge, OCVertex } from "../types";
import type { GraphSummary, OpenCypherFetch } from "../types";

import mapApiEdge from "../mappers/mapApiEdge";
import mapApiVertex from "../mappers/mapApiVertex";
import edgeLabelsTemplate from "./edgeLabelsTemplate";
import edgesSchemaTemplate from "./edgesSchemaTemplate";
import vertexLabelsTemplate from "./vertexLabelsTemplate";
import verticesSchemaTemplate from "./verticesSchemaTemplate";

// Response types for raw data returned by OpenCypher queries
type RawVertexLabelsResponse = {
  results: [
    {
      label: Array<string> | string;
      count: number;
    },
  ];
};

type RawEdgeLabelsResponse = {
  results: [
    {
      label: Array<string> | string;
      count: number;
    },
  ];
};

type RawVerticesSchemaResponse = {
  results:
    | [
        {
          object: OCVertex;
        },
      ]
    | []
    | undefined;
};

type RawEdgesSchemaResponse = {
  results:
    | [
        {
          object: OCEdge;
        },
      ]
    | []
    | undefined;
};

// Fetches all vertex labels and their counts
const fetchVertexLabels = async (
  openCypherFetch: OpenCypherFetch,
  remoteLogger: LoggerConnector,
): Promise<Record<string, number>> => {
  const labelsTemplate = vertexLabelsTemplate();
  remoteLogger.info(
    "[openCypher Explorer] Fetching vertex labels with counts...",
  );
  const data = await openCypherFetch<RawVertexLabelsResponse>(labelsTemplate);

  const values = data.results || [];
  const labelsWithCounts: Record<string, number> = {};
  for (let i = 0; i < values.length; i += 1) {
    const vertex = values[i];
    if (!vertex) {
      continue;
    }

    const label = Array.isArray(vertex.label) ? vertex.label[0] : vertex.label;

    if (!label) {
      continue;
    }

    labelsWithCounts[label] = vertex.count;
  }

  remoteLogger.info(
    `[openCypher Explorer] Found ${Object.keys(labelsWithCounts).length} vertex labels.`,
  );

  return labelsWithCounts;
};

// Fetches attributes for all vertices with the given labels
const fetchVerticesAttributes = async (
  openCypherFetch: OpenCypherFetch,
  remoteLogger: LoggerConnector,
  labels: Array<string>,
  countsByLabel: Record<string, number>,
): Promise<SchemaResponse["vertices"]> => {
  if (labels.length === 0) {
    return [];
  }

  remoteLogger.info("[openCypher Explorer] Fetching vertices attributes...");
  const responses = await batchPromisesSerially(
    labels,
    DEFAULT_CONCURRENT_REQUESTS_LIMIT,
    async label => {
      const verticesTemplate = verticesSchemaTemplate({
        type: label,
      });

      const response =
        await openCypherFetch<RawVerticesSchemaResponse>(verticesTemplate);

      return response.results ? response.results[0]?.object : null;
    },
  );

  const vertices = responses
    .flatMap(ocVertex => {
      // verify response has the info we need
      if (!ocVertex || !ocVertex["~labels"]) {
        return null;
      }

      const vertex = createVertex(mapApiVertex(ocVertex));
      const vertexTypeConfigs = mapVertexToTypeConfigs(vertex);
      return vertexTypeConfigs.map(vertexTypeConfig => ({
        ...vertexTypeConfig,
        total: countsByLabel[vertexTypeConfig.type],
      }));
    })
    .filter(vertexSchema => vertexSchema != null);

  remoteLogger.info(
    `[openCypher Explorer] Found ${vertices.flatMap(v => v.attributes).length} vertex attributes across ${vertices.length} vertex types.`,
  );

  return vertices;
};

// Fetches schema for all vertices
const fetchVerticesSchema = async (
  openCypherFetch: OpenCypherFetch,
  remoteLogger: LoggerConnector,
): Promise<SchemaResponse["vertices"]> => {
  const countsByLabel = await fetchVertexLabels(openCypherFetch, remoteLogger);
  const labels = Object.keys(countsByLabel);

  return fetchVerticesAttributes(
    openCypherFetch,
    remoteLogger,
    labels,
    countsByLabel,
  );
};

// Fetches all edge labels and their counts
const fetchEdgeLabels = async (
  openCypherFetch: OpenCypherFetch,
  remoteLogger: LoggerConnector,
): Promise<Record<string, number>> => {
  const labelsTemplate = edgeLabelsTemplate();
  remoteLogger.info(
    "[openCypher Explorer] Fetching edge labels with counts...",
  );
  const data = await openCypherFetch<RawEdgeLabelsResponse>(labelsTemplate);

  const values = data.results;
  const labelsWithCounts: Record<string, number> = {};

  if (!values) {
    return labelsWithCounts;
  }

  for (let i = 0; i < values.length; i += 1) {
    const edge = values[i];
    if (!edge) {
      continue;
    }

    const label = Array.isArray(edge.label) ? edge.label[0] : edge.label;

    if (!label) {
      continue;
    }

    labelsWithCounts[label] = edge.count;
  }

  remoteLogger.info(
    `[openCypher Explorer] Found ${Object.keys(labelsWithCounts).length} edge labels.`,
  );

  return labelsWithCounts;
};

// Fetches attributes for all edges with the given labels
const fetchEdgesAttributes = async (
  openCypherFetch: OpenCypherFetch,
  remoteLogger: LoggerConnector,
  labels: Array<string>,
  countsByLabel: Record<string, number>,
): Promise<SchemaResponse["edges"]> => {
  if (labels.length === 0) {
    return [];
  }

  remoteLogger.info("[openCypher Explorer] Fetching edges attributes...");
  const responses = await batchPromisesSerially(
    labels,
    DEFAULT_CONCURRENT_REQUESTS_LIMIT,
    async label => {
      const edgesTemplate = edgesSchemaTemplate({
        type: label,
      });

      const response =
        await openCypherFetch<RawEdgesSchemaResponse>(edgesTemplate);

      return response.results ? response.results[0]?.object : null;
    },
  );

  const edges = responses
    .map(ocEdge => {
      // verify response has the info we need
      if (!ocEdge || !ocEdge["~entityType"] || !ocEdge["~type"]) {
        return null;
      }

      const edge = createEdge(mapApiEdge(ocEdge));
      const edgeTypeConfig = mapEdgeToTypeConfig(edge);

      return {
        ...edgeTypeConfig,
        total: countsByLabel[edgeTypeConfig.type],
      };
    })
    .filter(edgeSchema => edgeSchema != null);

  remoteLogger.info(
    `[openCypher Explorer] Found ${edges.flatMap(e => e.attributes).length} edge attributes across ${edges.length} edge types.`,
  );

  return edges;
};

// Fetches schema for all edges
const fetchEdgesSchema = async (
  openCypherFetch: OpenCypherFetch,
  remoteLogger: LoggerConnector,
): Promise<SchemaResponse["edges"]> => {
  const countsByLabel = await fetchEdgeLabels(openCypherFetch, remoteLogger);
  const labels = Object.keys(countsByLabel);

  return fetchEdgesAttributes(
    openCypherFetch,
    remoteLogger,
    labels,
    countsByLabel,
  );
};

/**
 * Fetches the database schema.
 * It follows this process:
 * 1. Fetch all node labels and their counts
 * 2. Fetch one node of each node type to extract all properties
 * 3. Fetch all edge labels and their counts
 * 4. Fetch one edge of each edge type to extract all properties
 *
 * This is an optimistic schema because it does not guarantee that all
 * nodes/edges with the same label contains an exact set of attributes.
 *
 * @param openCypherFetch - Function to fetch data from the database
 * @param summary - Optional summary of the graph to fetch schema for
 * @returns The schema of the database
 */
const fetchSchema = async (
  openCypherFetch: OpenCypherFetch,
  remoteLogger: LoggerConnector,
  summary?: GraphSummary,
): Promise<SchemaResponse> => {
  if (!summary) {
    remoteLogger.info("[openCypher Explorer] No summary statistics");

    const vertices =
      (await fetchVerticesSchema(openCypherFetch, remoteLogger)) || [];
    const totalVertices = vertices.reduce((total, vertex) => {
      return total + (vertex.total ?? 0);
    }, 0);

    const edges = (await fetchEdgesSchema(openCypherFetch, remoteLogger)) || [];
    const totalEdges = edges.reduce((total, edge) => {
      return total + (edge.total ?? 0);
    }, 0);

    remoteLogger.info(
      `[openCypher Explorer] Schema sync successful (${totalVertices} vertices; ${totalEdges} edges; ${vertices.length} vertex types; ${edges.length} edge types)`,
    );

    return {
      totalVertices,
      vertices,
      totalEdges,
      edges,
    };
  }

  remoteLogger.info("[openCypher Explorer] Using summary statistics");

  const vertices =
    (await fetchVerticesAttributes(
      openCypherFetch,
      remoteLogger,
      summary.nodeLabels,
      {},
    )) || [];
  const edges =
    (await fetchEdgesAttributes(
      openCypherFetch,
      remoteLogger,
      summary.edgeLabels,
      {},
    )) || [];

  remoteLogger.info(
    `[openCypher Explorer] Schema sync successful (${summary.numNodes} vertices; ${summary.numEdges} edges; ${vertices.length} vertex types; ${edges.length} edge types)`,
  );

  return {
    totalVertices: summary.numNodes,
    vertices,
    totalEdges: summary.numEdges,
    edges,
  };
};

export default fetchSchema;
