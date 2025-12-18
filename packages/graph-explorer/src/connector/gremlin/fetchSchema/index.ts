import type { SchemaResponse } from "@/connector/useGEFetchTypes";
import edgeConnectionsTemplate from "./edgeConnectionsTemplate";
import edgeLabelsTemplate from "./edgeLabelsTemplate";
import edgesSchemaTemplate from "./edgesSchemaTemplate";
import vertexLabelsTemplate from "./vertexLabelsTemplate";
import verticesSchemaTemplate from "./verticesSchemaTemplate";
import type { GEdge, GInt64, GVertex } from "../types";
import type { GraphSummary, GremlinFetch } from "../types";
import { chunk } from "lodash";
import type { LoggerConnector } from "@/connector/LoggerConnector";
import { DEFAULT_BATCH_REQUEST_SIZE } from "@/utils";
import {
  createEdge,
  createVertex,
  type EdgeConnection,
  mapEdgeToTypeConfig,
  mapVertexToTypeConfigs,
} from "@/core";
import mapApiVertex from "../mappers/mapApiVertex";
import mapApiEdge from "../mappers/mapApiEdge";

type RawVertexLabelsResponse = {
  requestId: string;
  status: {
    message: string;
    code: number;
  };
  result: {
    data: {
      "@type": "g:List";
      "@value": [
        {
          "@type": "g:Map";
          "@value": Array<string | GInt64>;
        },
      ];
    };
  };
};

type RawEdgeLabelsResponse = {
  requestId: string;
  status: {
    message: string;
    code: number;
  };
  result: {
    data: {
      "@type": "g:List";
      "@value": [
        {
          "@type": "g:Map";
          "@value": Array<string | GInt64>;
        },
      ];
    };
  };
};

type RawVerticesSchemaResponse = {
  requestId: string;
  status: {
    message: string;
    code: number;
  };
  result: {
    data: {
      "@type": "g:List";
      "@value": [
        {
          "@type": "g:Map";
          "@value": Array<string | GVertex>;
        },
      ];
    };
  };
};

type RawEdgesSchemaResponse = {
  requestId: string;
  status: {
    message: string;
    code: number;
  };
  result: {
    data: {
      "@type": "g:List";
      "@value": [
        {
          "@type": "g:Map";
          "@value": Array<string | GEdge>;
        },
      ];
    };
  };
};

type GMap = {
  "@type": "g:Map";
  "@value": Array<string | GInt64 | GMap>;
};

type RawEdgeConnectionsResponse = {
  requestId: string;
  status: {
    message: string;
    code: number;
  };
  result: {
    data: {
      "@type": "g:List";
      "@value": [GMap];
    };
  };
};

const fetchVertexLabels = async (
  gremlinFetch: GremlinFetch,
  remoteLogger: LoggerConnector,
): Promise<Record<string, number>> => {
  const labelsTemplate = vertexLabelsTemplate();
  remoteLogger.info("[Gremlin Explorer] Fetching vertex labels with counts...");
  const data = await gremlinFetch<RawVertexLabelsResponse>(labelsTemplate);

  const values = data.result.data["@value"][0]["@value"];
  const labelsWithCounts: Record<string, number> = {};
  for (let i = 0; i < values.length; i += 2) {
    labelsWithCounts[values[i] as string] = (values[i + 1] as GInt64)["@value"];
  }

  remoteLogger.info(
    `[Gremlin Explorer] Found ${Object.keys(labelsWithCounts).length} vertex labels.`,
  );

  return labelsWithCounts;
};

const fetchVerticesAttributes = async (
  gremlinFetch: GremlinFetch,
  remoteLogger: LoggerConnector,
  labels: Array<string>,
  countsByLabel: Record<string, number>,
): Promise<SchemaResponse["vertices"]> => {
  const vertices: SchemaResponse["vertices"] = [];

  if (labels.length === 0) {
    return vertices;
  }

  // Batch in to sets of 100
  const batches = chunk(labels, DEFAULT_BATCH_REQUEST_SIZE);

  remoteLogger.info("[Gremlin Explorer] Fetching vertices attributes...");
  for (const batch of batches) {
    const verticesTemplate = verticesSchemaTemplate({
      types: batch,
    });

    const response =
      await gremlinFetch<RawVerticesSchemaResponse>(verticesTemplate);
    const verticesSchemas = response.result.data["@value"][0]["@value"];

    for (let i = 0; i < verticesSchemas.length; i += 2) {
      const gVertex = verticesSchemas[i + 1] as GVertex;
      const vertex = createVertex(mapApiVertex(gVertex));
      const vtConfigs = mapVertexToTypeConfigs(vertex);

      for (const vtConfig of vtConfigs) {
        vtConfig.total = countsByLabel[vtConfig.type];
        vertices.push(vtConfig);
      }
    }
  }

  remoteLogger.info(
    `[Gremlin Explorer] Found ${vertices.flatMap(v => v.attributes).length} vertex attributes across ${vertices.length} vertex types.`,
  );

  return vertices;
};

const fetchVerticesSchema = async (
  gremlinFetch: GremlinFetch,
  remoteLogger: LoggerConnector,
): Promise<SchemaResponse["vertices"]> => {
  const countsByLabel = await fetchVertexLabels(gremlinFetch, remoteLogger);
  const labels = Object.keys(countsByLabel);

  return fetchVerticesAttributes(
    gremlinFetch,
    remoteLogger,
    labels,
    countsByLabel,
  );
};

const fetchEdgeLabels = async (
  gremlinFetch: GremlinFetch,
  remoteLogger: LoggerConnector,
): Promise<Record<string, number>> => {
  const labelsTemplate = edgeLabelsTemplate();
  remoteLogger.info("[Gremlin Explorer] Fetching edge labels with counts...");
  const data = await gremlinFetch<RawEdgeLabelsResponse>(labelsTemplate);

  const values = data.result.data["@value"][0]["@value"];
  const labelsWithCounts: Record<string, number> = {};
  for (let i = 0; i < values.length; i += 2) {
    labelsWithCounts[values[i] as string] = (values[i + 1] as GInt64)["@value"];
  }

  remoteLogger.info(
    `[Gremlin Explorer] Found ${Object.keys(labelsWithCounts).length} edge labels.`,
  );

  return labelsWithCounts;
};

const fetchEdgesAttributes = async (
  gremlinFetch: GremlinFetch,
  remoteLogger: LoggerConnector,
  labels: Array<string>,
  countsByLabel: Record<string, number>,
): Promise<SchemaResponse["edges"]> => {
  const edges: SchemaResponse["edges"] = [];
  if (labels.length === 0) {
    return edges;
  }

  // Batch in to sets of 100
  const batches = chunk(labels, DEFAULT_BATCH_REQUEST_SIZE);

  remoteLogger.info("[Gremlin Explorer] Fetching edges attributes...");
  for (const batch of batches) {
    const edgesTemplate = edgesSchemaTemplate({
      types: batch,
    });
    const data = await gremlinFetch<RawEdgesSchemaResponse>(edgesTemplate);

    const edgesSchemas = data.result.data["@value"][0]["@value"];

    for (let i = 0; i < edgesSchemas.length; i += 2) {
      const label = edgesSchemas[i] as string;
      const gEdge = edgesSchemas[i + 1] as GEdge;
      const edge = createEdge(mapApiEdge(gEdge));
      const etConfig = mapEdgeToTypeConfig(edge);
      etConfig.total = countsByLabel[label];
      edges.push(etConfig);
    }
  }

  remoteLogger.info(
    `[Gremlin Explorer] Found ${edges.flatMap(e => e.attributes).length} edge attributes across ${edges.length} edge types.`,
  );

  return edges;
};

const fetchEdgesSchema = async (
  gremlinFetch: GremlinFetch,
  remoteLogger: LoggerConnector,
): Promise<SchemaResponse["edges"]> => {
  const countsByLabel = await fetchEdgeLabels(gremlinFetch, remoteLogger);
  const labels = Object.keys(countsByLabel);

  return fetchEdgesAttributes(
    gremlinFetch,
    remoteLogger,
    labels,
    countsByLabel,
  );
};

/**
 * Splits a Neptune Gremlin label string by `::` separator.
 * Neptune stores multiple labels as a single string separated by `::`.
 */
const splitGremlinLabels = (label: string): string[] => {
  return label.split("::");
};

/**
 * Expands edge connections for multi-label nodes.
 * For a source with M labels and target with N labels, creates M × N connections.
 */
const expandEdgeConnections = (
  sourceLabels: string[],
  edgeType: string,
  targetLabels: string[],
  count: number,
): EdgeConnection[] => {
  const connections: EdgeConnection[] = [];
  for (const sourceLabel of sourceLabels) {
    for (const targetLabel of targetLabels) {
      connections.push({
        edgeType,
        sourceLabel,
        targetLabel,
        count,
      });
    }
  }
  return connections;
};

/**
 * Fetches edge connections between node labels.
 * Returns distinct combinations of source label, edge type, and target label.
 */
const fetchEdgeConnections = async (
  gremlinFetch: GremlinFetch,
  remoteLogger: LoggerConnector,
): Promise<EdgeConnection[]> => {
  const template = edgeConnectionsTemplate();
  remoteLogger.info("[Gremlin Explorer] Fetching edge connections...");

  try {
    const data = await gremlinFetch<RawEdgeConnectionsResponse>(template);

    const edgeConnections: EdgeConnection[] = [];
    const mapValue = data.result.data["@value"][0]["@value"];

    // The response is a flat array alternating between key (GMap) and value (GInt64)
    for (let i = 0; i < mapValue.length; i += 2) {
      const keyMap = mapValue[i] as GMap;
      const countValue = mapValue[i + 1] as GInt64;

      // Parse the key map which contains source, edge, target
      const keyValues = keyMap["@value"];
      let source = "";
      let edge = "";
      let target = "";

      for (let j = 0; j < keyValues.length; j += 2) {
        const key = keyValues[j] as string;
        const value = keyValues[j + 1] as string;
        if (key === "source") source = value;
        else if (key === "edge") edge = value;
        else if (key === "target") target = value;
      }

      const count = countValue["@value"];

      // Handle multi-label nodes by splitting on :: and expanding
      const sourceLabels = splitGremlinLabels(source);
      const targetLabels = splitGremlinLabels(target);
      const expanded = expandEdgeConnections(
        sourceLabels,
        edge,
        targetLabels,
        count,
      );
      edgeConnections.push(...expanded);
    }

    remoteLogger.info(
      `[Gremlin Explorer] Found ${edgeConnections.length} edge connections.`,
    );

    return edgeConnections;
  } catch (error) {
    remoteLogger.warn(
      `[Gremlin Explorer] Failed to fetch edge connections, continuing without them: ${String(error)}`,
    );
    return [];
  }
};

/**
 * Fetch the database shape.
 * It follows this process:
 * 1. Fetch all nodes labels and their counts
 * 2. Fetch one sample of each node type to extract all properties
 * 3. Fetch all edges labels and their counts
 * 4. Fetch one sample of each edge type to extract all properties
 *
 * This is an optimistic schema because it does not guarantee that all
 * nodes/edges with the same label contains an exact set of attributes.
 */
const fetchSchema = async (
  gremlinFetch: GremlinFetch,
  remoteLogger: LoggerConnector,
  summary?: GraphSummary,
): Promise<SchemaResponse> => {
  // Fetch edge connections (works with or without summary)
  const edgeConnections = await fetchEdgeConnections(
    gremlinFetch,
    remoteLogger,
  );

  if (!summary) {
    remoteLogger.info("[Gremlin Explorer] No summary statistics");

    const vertices = await fetchVerticesSchema(gremlinFetch, remoteLogger);
    const totalVertices = vertices.reduce((total, vertex) => {
      return total + (vertex.total ?? 0);
    }, 0);

    const edges = await fetchEdgesSchema(gremlinFetch, remoteLogger);
    const totalEdges = edges.reduce((total, edge) => {
      return total + (edge.total ?? 0);
    }, 0);

    remoteLogger.info(
      `[Gremlin Explorer] Schema sync successful (${totalVertices} vertices; ${totalEdges} edges; ${vertices.length} vertex types; ${edges.length} edge types; ${edgeConnections.length} edge connections)`,
    );

    return {
      totalVertices,
      vertices,
      totalEdges,
      edges,
      edgeConnections,
    };
  }

  remoteLogger.info("[Gremlin Explorer] Using summary statistics");

  const vertices = await fetchVerticesAttributes(
    gremlinFetch,
    remoteLogger,
    summary.nodeLabels,
    {},
  );
  const edges = await fetchEdgesAttributes(
    gremlinFetch,
    remoteLogger,
    summary.edgeLabels,
    {},
  );

  remoteLogger.info(
    `[Gremlin Explorer] Schema sync successful (${summary.numNodes} vertices; ${summary.numEdges} edges; ${vertices.length} vertex types; ${edges.length} edge types; ${edgeConnections.length} edge connections)`,
  );

  return {
    totalVertices: summary.numNodes,
    vertices,
    totalEdges: summary.numEdges,
    edges,
    edgeConnections,
  };
};

export default fetchSchema;
