import { sanitizeText } from "../../../utils";
import type { SchemaResponse } from "../../AbstractConnector";
import edgeLabelsTemplate from "../templates/edgeLabelsTemplate";
import edgesSchemaTemplate from "../templates/edgesSchemaTemplate";
import vertexLabelsTemplate from "../templates/vertexLabelsTemplate";
import verticesSchemaTemplate from "../templates/verticesSchemaTemplate";
import type { GEdge, GInt64, GVertex } from "../types";
import { GremlinFetch } from "../types";

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

const fetchVerticesSchema = async (
  gremlinFetch: GremlinFetch
): Promise<SchemaResponse["vertices"]> => {
  const allLabels = await fetchVertexLabels(gremlinFetch);
  const vertices: SchemaResponse["vertices"] = [];
<<<<<<< HEAD
<<<<<<< HEAD:packages/graph-explorer/src/connector/gremlin/queries/fetchSchema.ts
  const labels = Object.keys(allLabels);

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
      total: allLabels[label],
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
=======

  if (JSON.stringify(allLabels) != "{}" ) {
    const verticesTemplate = verticesSchemaTemplate({
      types: Object.keys(allLabels),
>>>>>>> 00a6590 (12/08 5:31PM CT push):packages/client/src/connector/gremlin/queries/fetchSchema.ts
=======
  const labels = Object.keys(allLabels);

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
      total: allLabels[label],
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
>>>>>>> beca7aa (12/09 12:22PM push)
    });
  }

  return vertices;
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

const fetchEdgesSchema = async (
  gremlinFetch: GremlinFetch
): Promise<SchemaResponse["edges"]> => {
  const allLabels = await fetchEdgeLabels(gremlinFetch);
  const edges: SchemaResponse["edges"] = [];
<<<<<<< HEAD
<<<<<<< HEAD:packages/graph-explorer/src/connector/gremlin/queries/fetchSchema.ts
  const labels = Object.keys(allLabels);

  if (labels.length === 0) {
    return edges;
  }

  const edgesTemplate = edgesSchemaTemplate({
    types: labels,
  });
  const data = await gremlinFetch<RawEdgesSchemaResponse>(edgesTemplate);

  const edgesSchemas = data.result.data["@value"][0]["@value"];
=======
>>>>>>> 00a6590 (12/08 5:31PM CT push):packages/client/src/connector/gremlin/queries/fetchSchema.ts
=======
  const labels = Object.keys(allLabels);
>>>>>>> beca7aa (12/09 12:22PM push)

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
      total: allLabels[label],
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
  gremlinFetch: GremlinFetch
): Promise<SchemaResponse> => {
  const vertices = await fetchVerticesSchema(gremlinFetch);
  const edges = await fetchEdgesSchema(gremlinFetch);

  return {
    vertices,
    edges,
  };
};

export default fetchSchema;
