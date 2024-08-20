import { batchPromisesSerially, sanitizeText } from "@/utils";
import { DEFAULT_CONCURRENT_REQUESTS_LIMIT } from "@/utils/constants";
import type {
  EdgeSchemaResponse,
  SchemaResponse,
  VertexSchemaResponse,
} from "@/connector/useGEFetchTypes";
import edgeLabelsTemplate from "../templates/edgeLabelsTemplate";
import edgesSchemaTemplate from "../templates/edgesSchemaTemplate";
import vertexLabelsTemplate from "../templates/vertexLabelsTemplate";
import verticesSchemaTemplate from "../templates/verticesSchemaTemplate";
import type { OCEdge, OCVertex } from "../types";
import { GraphSummary, OpenCypherFetch } from "../types";

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
  openCypherFetch: OpenCypherFetch
): Promise<Record<string, number>> => {
  const labelsTemplate = vertexLabelsTemplate();
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

  return labelsWithCounts;
};

// Fetches attributes for all vertices with the given labels
const fetchVerticesAttributes = async (
  openCypherFetch: OpenCypherFetch,
  labels: Array<string>,
  countsByLabel: Record<string, number>
): Promise<SchemaResponse["vertices"]> => {
  if (labels.length === 0) {
    return [];
  }

  const responses = await batchPromisesSerially(
    labels,
    DEFAULT_CONCURRENT_REQUESTS_LIMIT,
    async label => {
      const verticesTemplate = verticesSchemaTemplate({
        type: label,
      });

      const response =
        await openCypherFetch<RawVerticesSchemaResponse>(verticesTemplate);

      return {
        vertex: response.results ? response.results[0]?.object : null,
        label,
      };
    }
  );

  const vertices = responses
    .map(({ vertex }) => {
      // verify response has the info we need
      if (!vertex || !vertex["~labels"]) {
        return null;
      }

      // Use the first label
      const label = vertex["~labels"][0];
      const properties = vertex["~properties"];
      const vertexSchema: VertexSchemaResponse = {
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
      };
      return vertexSchema;
    })
    .filter(vertexSchema => vertexSchema != null);

  return vertices;
};

// Fetches schema for all vertices
const fetchVerticesSchema = async (
  openCypherFetch: OpenCypherFetch
): Promise<SchemaResponse["vertices"]> => {
  const countsByLabel = await fetchVertexLabels(openCypherFetch);
  const labels = Object.keys(countsByLabel);

  return fetchVerticesAttributes(openCypherFetch, labels, countsByLabel);
};

// Fetches all edge labels and their counts
const fetchEdgeLabels = async (
  openCypherFetch: OpenCypherFetch
): Promise<Record<string, number>> => {
  const labelsTemplate = edgeLabelsTemplate();
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

  return labelsWithCounts;
};

// Fetches attributes for all edges with the given labels
const fetchEdgesAttributes = async (
  openCypherFetch: OpenCypherFetch,
  labels: Array<string>,
  countsByLabel: Record<string, number>
): Promise<SchemaResponse["edges"]> => {
  if (labels.length === 0) {
    return [];
  }

  const responses = await batchPromisesSerially(
    labels,
    DEFAULT_CONCURRENT_REQUESTS_LIMIT,
    async label => {
      const edgesTemplate = edgesSchemaTemplate({
        type: label,
      });

      const response =
        await openCypherFetch<RawEdgesSchemaResponse>(edgesTemplate);

      return {
        edge: response.results ? response.results[0]?.object : null,
        label,
      };
    }
  );

  const edges = responses
    .map(({ edge, label }) => {
      // verify response has the info we need
      if (!edge || !edge["~entityType"] || !edge["~type"]) {
        return null;
      }

      const type = edge["~type"];
      const properties = edge["~properties"];
      const edgeSchema: EdgeSchemaResponse = {
        type: type,
        displayLabel: sanitizeText(type),
        total: countsByLabel[label],
        attributes: Object.entries(properties || {}).map(([name, prop]) => {
          const value = prop;
          return {
            name,
            displayLabel: sanitizeText(name),
            dataType: typeof value === "string" ? "String" : "Number",
          };
        }),
      };
      return edgeSchema;
    })
    .filter(edgeSchema => edgeSchema != null);

  return edges;
};

// Fetches schema for all edges
const fetchEdgesSchema = async (
  openCypherFetch: OpenCypherFetch
): Promise<SchemaResponse["edges"]> => {
  const countsByLabel = await fetchEdgeLabels(openCypherFetch);
  const labels = Object.keys(countsByLabel);

  return fetchEdgesAttributes(openCypherFetch, labels, countsByLabel);
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
  summary?: GraphSummary
): Promise<SchemaResponse> => {
  if (!summary) {
    const vertices = (await fetchVerticesSchema(openCypherFetch)) || [];
    const totalVertices = vertices.reduce((total, vertex) => {
      return total + (vertex.total ?? 0);
    }, 0);

    const edges = (await fetchEdgesSchema(openCypherFetch)) || [];
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

  const vertices =
    (await fetchVerticesAttributes(openCypherFetch, summary.nodeLabels, {})) ||
    [];
  const edges =
    (await fetchEdgesAttributes(openCypherFetch, summary.edgeLabels, {})) || [];

  return {
    totalVertices: summary.numNodes,
    vertices,
    totalEdges: summary.numEdges,
    edges,
  };
};

export default fetchSchema;
