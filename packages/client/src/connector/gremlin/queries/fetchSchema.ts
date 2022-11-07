import { sanitizeText } from "../../../utils";
import type { SchemaResponse } from "../../AbstractConnector";
import edgeLabelsTemplate from "../templates/edgeLabelsTemplate";
import edgeSchemaTemplate from "../templates/edgeSchemaTemplate";
import vertexLabelsTemplate from "../templates/vertexLabelsTemplate";
import vertexSchemaTemplate from "../templates/vertexSchemaTemplate";
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

type RawVertexSchemaResponse = {
  requestId: string;
  status: {
    message: string;
    code: number;
  };
  result: {
    data: {
      "@type": "g:List";
      "@value": Array<GVertex>;
    };
  };
};

type RawEdgeSchemaResponse = {
  requestId: string;
  status: {
    message: string;
    code: number;
  };
  result: {
    data: {
      "@type": "g:List";
      "@value": Array<GEdge>;
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

const fetchVertexSchema = async (
  gremlinFetch: GremlinFetch,
  vertexType: string
) => {
  const gremlinTemplate = vertexSchemaTemplate({ type: vertexType });
  const data = await gremlinFetch<RawVertexSchemaResponse>(gremlinTemplate);
  const properties = data.result.data["@value"][0]["@value"].properties;

  return {
    type: vertexType,
    displayLabel: sanitizeText(vertexType),
    attributes: Object.entries(properties).map(([name, prop]) => {
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
  };
};

const fetchVerticesSchema = async (
  gremlinFetch: GremlinFetch
): Promise<SchemaResponse["vertices"]> => {
  const allLabels = await fetchVertexLabels(gremlinFetch);

  const verticesSchemas = await Promise.all(
    Object.entries(allLabels).map(async ([label, count]) => {
      const vSchema = await fetchVertexSchema(gremlinFetch, label);

      return {
        ...vSchema,
        total: count,
      };
    })
  );

  return verticesSchemas;
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

const fetchEdgeSchema = async (
  gremlinFetch: GremlinFetch,
  edgeType: string
) => {
  const gremlinTemplate = edgeSchemaTemplate({ type: edgeType });
  const data = await gremlinFetch<RawEdgeSchemaResponse>(gremlinTemplate);
  const properties = data.result.data["@value"][0]["@value"].properties;

  return {
    type: edgeType,
    displayLabel: sanitizeText(edgeType),
    attributes: Object.entries(properties || {}).map(([name, prop]) => {
      const value = prop["@value"].value;
      return {
        name,
        displayLabel: sanitizeText(name),
        dataType: typeof value === "string" ? "String" : value["@type"],
      };
    }),
  };
};

const fetchEdgesSchema = async (gremlinFetch: GremlinFetch) => {
  const allLabels = await fetchEdgeLabels(gremlinFetch);

  const edgesSchemas = await Promise.all(
    Object.entries(allLabels).map(async ([label, count]) => {
      const vSchema = await fetchEdgeSchema(gremlinFetch, label);

      return {
        ...vSchema,
        total: count,
      };
    })
  );

  return edgesSchemas;
};

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
