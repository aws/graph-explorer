import type { SchemaResponse } from "@/connector/useGEFetchTypes";
import edgeLabelsTemplate from "./edgeLabelsTemplate";
import edgesSchemaTemplate from "./edgesSchemaTemplate";
import vertexLabelsTemplate from "./vertexLabelsTemplate";
import verticesSchemaTemplate from "./verticesSchemaTemplate";
import type { GEdge, GInt64, GScalar, GVertex } from "../types";
import { GraphSummary, GremlinFetch } from "../types";
import { chunk } from "lodash";
import { LoggerConnector } from "@/connector/LoggerConnector";
import { DEFAULT_BATCH_REQUEST_SIZE } from "@/utils";

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

const fetchVertexLabels = async (
  gremlinFetch: GremlinFetch,
  remoteLogger: LoggerConnector
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
    `[Gremlin Explorer] Found ${Object.keys(labelsWithCounts).length} vertex labels.`
  );

  return labelsWithCounts;
};

const TYPE_MAP = {
  "g:Date": "Date" as const,
  "g:Int32": "Number" as const,
  "g:Int64": "Number" as const,
  "g:Double": "Number" as const,
  "g:Float": "Number" as const,
  "g:T": "String" as const,
};

const fetchVerticesAttributes = async (
  gremlinFetch: GremlinFetch,
  remoteLogger: LoggerConnector,
  labels: Array<string>,
  countsByLabel: Record<string, number>
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
      const label = verticesSchemas[i] as string;
      const vertex = verticesSchemas[i + 1] as GVertex;
      const properties = vertex["@value"].properties ?? {};
      vertices.push({
        type: label,
        total: countsByLabel[label],
        attributes: Object.entries(properties || {}).map(([name, prop]) => {
          const value = prop[0]?.["@value"].value;
          const dataType = mapValueToDataType(value);
          return { name, dataType };
        }),
      });
    }
  }

  remoteLogger.info(
    `[Gremlin Explorer] Found ${vertices.flatMap(v => v.attributes).length} vertex attributes across ${vertices.length} vertex types.`
  );

  return vertices;
};

const fetchVerticesSchema = async (
  gremlinFetch: GremlinFetch,
  remoteLogger: LoggerConnector
): Promise<SchemaResponse["vertices"]> => {
  const countsByLabel = await fetchVertexLabels(gremlinFetch, remoteLogger);
  const labels = Object.keys(countsByLabel);

  return fetchVerticesAttributes(
    gremlinFetch,
    remoteLogger,
    labels,
    countsByLabel
  );
};

const fetchEdgeLabels = async (
  gremlinFetch: GremlinFetch,
  remoteLogger: LoggerConnector
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
    `[Gremlin Explorer] Found ${Object.keys(labelsWithCounts).length} edge labels.`
  );

  return labelsWithCounts;
};

const fetchEdgesAttributes = async (
  gremlinFetch: GremlinFetch,
  remoteLogger: LoggerConnector,
  labels: Array<string>,
  countsByLabel: Record<string, number>
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
      const vertex = edgesSchemas[i + 1] as GEdge;
      const properties = vertex["@value"].properties;
      edges.push({
        type: label,
        total: countsByLabel[label],
        attributes: Object.entries(properties || {}).map(([name, prop]) => {
          const value = prop["@value"].value;
          const dataType = mapValueToDataType(value);

          return { name, dataType };
        }),
      });
    }
  }

  remoteLogger.info(
    `[Gremlin Explorer] Found ${edges.flatMap(e => e.attributes).length} edge attributes across ${edges.length} edge types.`
  );

  return edges;
};

function mapValueToDataType(value: GScalar) {
  if (typeof value === "string") {
    return "String";
  }

  if (typeof value === "boolean") {
    return "Boolean";
  }

  return TYPE_MAP[value["@type"]] || "String";
}

const fetchEdgesSchema = async (
  gremlinFetch: GremlinFetch,
  remoteLogger: LoggerConnector
): Promise<SchemaResponse["edges"]> => {
  const countsByLabel = await fetchEdgeLabels(gremlinFetch, remoteLogger);
  const labels = Object.keys(countsByLabel);

  return fetchEdgesAttributes(
    gremlinFetch,
    remoteLogger,
    labels,
    countsByLabel
  );
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
  summary?: GraphSummary
): Promise<SchemaResponse> => {
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
      `[Gremlin Explorer] Schema sync successful (${totalVertices} vertices; ${totalEdges} edges; ${vertices.length} vertex types; ${edges.length} edge types)`
    );

    return {
      totalVertices,
      vertices,
      totalEdges,
      edges,
    };
  }

  remoteLogger.info("[Gremlin Explorer] Using summary statistics");

  const vertices = await fetchVerticesAttributes(
    gremlinFetch,
    remoteLogger,
    summary.nodeLabels,
    {}
  );
  const edges = await fetchEdgesAttributes(
    gremlinFetch,
    remoteLogger,
    summary.edgeLabels,
    {}
  );

  remoteLogger.info(
    `[Gremlin Explorer] Schema sync successful (${summary.numNodes} vertices; ${summary.numEdges} edges; ${vertices.length} vertex types; ${edges.length} edge types)`
  );

  return {
    totalVertices: summary.numNodes,
    vertices,
    totalEdges: summary.numEdges,
    edges,
  };
};

export default fetchSchema;
