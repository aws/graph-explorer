import { sanitizeText } from "../../../utils";
import type { SchemaResponse } from "../../AbstractConnector";
import edgeLabelsTemplate from "../templates/edgeLabelsTemplate";
import edgesSchemaTemplate from "../templates/edgesSchemaTemplate";
import vertexLabelsTemplate from "../templates/vertexLabelsTemplate";
import verticesSchemaTemplate from "../templates/verticesSchemaTemplate";
import type { GEdge, GInt64, GVertex } from "../types";
import { GraphSummary, GremlinFetch } from "../types";

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
        }
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
        }
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
        }
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
        }
      ];
    };
  };
};

const fetchVertexLabels = async (
  gremlinFetch: GremlinFetch
): Promise<Record<string, number>> => {
  const labelsTemplate = vertexLabelsTemplate();
  const data = await gremlinFetch<RawVertexLabelsResponse>(labelsTemplate);

  const values = data.result.data["@value"][0]["@value"];
  const labelsWithCounts: Record<string, number> = {};
  for (let i = 0; i < values.length; i += 2) {
    labelsWithCounts[values[i] as string] = (values[i + 1] as GInt64)["@value"];
  }

  return labelsWithCounts;
};

const TYPE_MAP = {
  "g:Date": "Date",
  "g:Int32": "Number",
  "g:Int64": "Number",
  "g:Double": "Number",
  "g:Float": "Number",
};

const fetchVerticesAttributes = async (
  gremlinFetch: GremlinFetch,
  labels: Array<string>,
  countsByLabel: Record<string, number>
): Promise<SchemaResponse["vertices"]> => {
  const vertices: SchemaResponse["vertices"] = [];

  if (labels.length === 0) {
    return vertices;
  }

  const verticesTemplate = verticesSchemaTemplate({
    types: labels,
  });

  const response = await gremlinFetch<RawVerticesSchemaResponse>(
    verticesTemplate
  );
  const verticesSchemas = response.result.data["@value"][0]["@value"];

  for (let i = 0; i < verticesSchemas.length; i += 2) {
    const label = verticesSchemas[i] as string;
    const vertex = verticesSchemas[i + 1] as GVertex;
    const properties = vertex["@value"].properties;
    vertices.push({
      type: label,
      displayLabel: sanitizeText(label),
      total: countsByLabel[label],
      attributes: Object.entries(properties || {}).map(([name, prop]) => {
        const value = prop[0]?.["@value"].value;
        return {
          name,
          displayLabel: sanitizeText(name),
          dataType:
            typeof value === "string"
              ? "String"
              : TYPE_MAP[value["@type"]] || "String",
        };
      }),
    });
  }

  return vertices;
};

const fetchVerticesSchema = async (
  gremlinFetch: GremlinFetch
): Promise<SchemaResponse["vertices"]> => {
  const countsByLabel = await fetchVertexLabels(gremlinFetch);
  const labels = Object.keys(countsByLabel);

  return fetchVerticesAttributes(gremlinFetch, labels, countsByLabel);
};

const fetchEdgeLabels = async (
  gremlinFetch: GremlinFetch
): Promise<Record<string, number>> => {
  const labelsTemplate = edgeLabelsTemplate();
  const data = await gremlinFetch<RawEdgeLabelsResponse>(labelsTemplate);

  const values = data.result.data["@value"][0]["@value"];
  const labelsWithCounts: Record<string, number> = {};
  for (let i = 0; i < values.length; i += 2) {
    labelsWithCounts[values[i] as string] = (values[i + 1] as GInt64)["@value"];
  }

  return labelsWithCounts;
};

const fetchEdgesAttributes = async (
  gremlinFetch: GremlinFetch,
  labels: Array<string>,
  countsByLabel: Record<string, number>
): Promise<SchemaResponse["edges"]> => {
  const edges: SchemaResponse["edges"] = [];
  if (labels.length === 0) {
    return edges;
  }

  const edgesTemplate = edgesSchemaTemplate({
    types: labels,
  });
  const data = await gremlinFetch<RawEdgesSchemaResponse>(edgesTemplate);

  const edgesSchemas = data.result.data["@value"][0]["@value"];

  for (let i = 0; i < edgesSchemas.length; i += 2) {
    const label = edgesSchemas[i] as string;
    const vertex = edgesSchemas[i + 1] as GEdge;
    const properties = vertex["@value"].properties;
    edges.push({
      type: label,
      displayLabel: sanitizeText(label),
      total: countsByLabel[label],
      attributes: Object.entries(properties || {}).map(([name, prop]) => {
        const value = prop["@value"].value;
        return {
          name,
          displayLabel: sanitizeText(name),
          dataType: typeof value === "string" ? "String" : value["@type"],
        };
      }),
    });
  }

  return edges;
};

const fetchEdgesSchema = async (
  gremlinFetch: GremlinFetch
): Promise<SchemaResponse["edges"]> => {
  const countsByLabel = await fetchEdgeLabels(gremlinFetch);
  const labels = Object.keys(countsByLabel);

  return fetchEdgesAttributes(gremlinFetch, labels, countsByLabel);
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
  summary?: GraphSummary
): Promise<SchemaResponse> => {
  if (!summary) {
    const vertices = await fetchVerticesSchema(gremlinFetch);
    const totalVertices = vertices.reduce((total, vertex) => {
      return total + (vertex.total ?? 0);
    }, 0);

    const edges = await fetchEdgesSchema(gremlinFetch);
    const totalEdges = edges.reduce((total, edge) => {
      return total + (edge.total ?? 0);
    }, 0);

    return {
      totalVertices,
      vertices,
      totalEdges,
      edges,
    };
  }

  const vertices = await fetchVerticesAttributes(
    gremlinFetch,
    summary.nodeLabels,
    {}
  );
  const edges = await fetchEdgesAttributes(
    gremlinFetch,
    summary.edgeLabels,
    {}
  );

  return {
    totalVertices: summary.numNodes,
    vertices,
    totalEdges: summary.numEdges,
    edges,
  };
};

export default fetchSchema;
