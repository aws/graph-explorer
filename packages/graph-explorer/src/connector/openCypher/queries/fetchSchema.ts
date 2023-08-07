import { sanitizeText } from "../../../utils";
import type { SchemaResponse } from "../../AbstractConnector";
import edgeLabelsTemplate from "../templates/edgeLabelsTemplate";
import edgesSchemaTemplate from "../templates/edgesSchemaTemplate";
import vertexLabelsTemplate from "../templates/vertexLabelsTemplate";
import verticesSchemaTemplate from "../templates/verticesSchemaTemplate";
import type { OCEdge, OCVertex } from "../types";
import { GraphSummary, OpenCypherFetch } from "../types";

type RawVertexLabelsResponse = {
    results: [
        {
            label: Array<string>;
            count: number;
        }
    ];
}

type RawEdgeLabelsResponse = {
    results: [
        {
            label: Array<string>;
            count: number;
        }
    ];
};


type RawVerticesSchemaResponse = {
    results: [
        {
            object: OCVertex;
        }
    ];
};

type RawEdgesSchemaResponse = {
    results: [
        {
            object: OCEdge;
        }
    ];
};

const fetchVertexLabels = async (
  openCypherFetch: OpenCypherFetch
): Promise<Record<string, number>> => {
  const labelsTemplate = vertexLabelsTemplate();
  const data = await openCypherFetch<RawVertexLabelsResponse>(labelsTemplate);

  const values = data.results;
  const labelsWithCounts: Record<string, number> = {};
  for (let i = 0; i < values.length; i += 1) {
    labelsWithCounts[values[i].label[0] as string] = (values[i].count as number);
  }

  return labelsWithCounts;
};

const fetchVerticesAttributes = async (
  openCypherFetch: OpenCypherFetch,
  labels: Array<string>,
  countsByLabel: Record<string, number>
): Promise<SchemaResponse["vertices"]> => {
  const vertices: SchemaResponse["vertices"] = [];

  if (labels.length === 0) {
    return vertices;
  }

  await Promise.all(
    labels.map(async labelResult => {
        const verticesTemplate = verticesSchemaTemplate({
            type: labelResult,
        });

        const response = await openCypherFetch<RawVerticesSchemaResponse>(verticesTemplate);

        const vertex = response.results[0].object as OCVertex;
        const label = vertex["~labels"][0] as string;
        const properties = vertex["~properties"];
        vertices.push({
            type: label,
            displayLabel: sanitizeText(label),
            total: countsByLabel[label],
            attributes: Object.entries(properties || {}).map(([name, prop]) => {
                const value = prop;
                return {
                name,
                displayLabel: sanitizeText(name),
                dataType:
                    typeof value === "string"
                    ? "String" : "Number",
                };
            }),
        });
    })
  );

  return vertices;
};

const fetchVerticesSchema = async (
  openCypherFetch: OpenCypherFetch
): Promise<SchemaResponse["vertices"]> => {
  const countsByLabel = await fetchVertexLabels(openCypherFetch);
  const labels = Object.keys(countsByLabel);

  return fetchVerticesAttributes(openCypherFetch, labels, countsByLabel);
};

const fetchEdgeLabels = async (
  openCypherFetch: OpenCypherFetch
): Promise<Record<string, number>> => {
  const labelsTemplate = edgeLabelsTemplate();
  const data = await openCypherFetch<RawEdgeLabelsResponse>(labelsTemplate);

  const values = data.results;
  const labelsWithCounts: Record<string, number> = {};
  for (let i = 0; i < values.length; i += 1) {
    labelsWithCounts[values[i].label[0] as string] = (values[i].count as number);
  }

  return labelsWithCounts;
};

const fetchEdgesAttributes = async (
  openCypherFetch: OpenCypherFetch,
  labels: Array<string>,
  countsByLabel: Record<string, number>
): Promise<SchemaResponse["edges"]> => {
    const edges: SchemaResponse["edges"] = [];

    if (labels.length === 0) {
        return edges;
    }

    await Promise.all(labels.map(async labelResult => {
        const edgesTemplate = edgesSchemaTemplate({
            type: labelResult
        });

        const response = await openCypherFetch<RawEdgesSchemaResponse>(edgesTemplate);

        const edge = response.results[0].object as OCEdge;
        const label = edge["~entityType"] as string;
        const properties = edge["~properties"];
        edges.push({
            type: label,
            displayLabel: sanitizeText(label),
            total: countsByLabel[label],
            attributes: Object.entries(properties || {}).map(([name, prop]) => {
                const value = prop;
                return {
                name,
                displayLabel: sanitizeText(name),
                dataType: typeof value === "string" ? "String" : "Number",
                };
            }),
        });
    }));

    return edges;
};

const fetchEdgesSchema = async (
  openCypherFetch: OpenCypherFetch
): Promise<SchemaResponse["edges"]> => {
  const countsByLabel = await fetchEdgeLabels(openCypherFetch);
  const labels = Object.keys(countsByLabel);

  return fetchEdgesAttributes(openCypherFetch, labels, countsByLabel);
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
  openCypherFetch: OpenCypherFetch,
  summary?: GraphSummary
): Promise<SchemaResponse> => {
  if (!summary) {
    const vertices = await fetchVerticesSchema(openCypherFetch);
    const totalVertices = vertices.reduce((total, vertex) => {
      return total + (vertex.total ?? 0);
    }, 0);

    const edges = await fetchEdgesSchema(openCypherFetch);
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
    openCypherFetch,
    summary.nodeLabels,
    {}
  );
  const edges = await fetchEdgesAttributes(
    openCypherFetch,
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
