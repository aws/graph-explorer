import { parseRdfEdgeIdString } from "@/connector/sparql/parseEdgeId";
import {
  createEdgeId,
  createVertexId,
  type EdgeId,
  type EntityRawId,
  type VertexId,
} from "@/core/entities";
import { escapeString, LABELS, logger } from "@/utils";
import {
  type ConnectionConfig,
  type QueryEngine,
  queryEngineOptions,
} from "@shared/types";
import { z } from "zod";

export const exportedGraphSchema = z.object({
  meta: z.object({
    kind: z.literal("graph-export"),
    version: z.literal("1.0"),
    timestamp: z.coerce.date(),
    source: z.string(),
    sourceVersion: z.string(),
  }),
  data: z.object({
    connection: z.object({
      dbUrl: z.string(),
      queryEngine: z.enum(queryEngineOptions),
    }),
    vertices: z.array(z.union([z.string(), z.number()])),
    edges: z.array(z.union([z.string(), z.number()])),
  }),
});

export type ExportedGraphFile = z.infer<typeof exportedGraphSchema>;
export type ExportedGraphConnection = ExportedGraphFile["data"]["connection"];

/** Creates an exported graph suitable for saving to a file. */
export function createExportedGraph(
  vertexIds: VertexId[],
  edgeIds: EdgeId[],
  connection: ConnectionConfig,
): ExportedGraphFile {
  return {
    meta: {
      kind: "graph-export",
      source: LABELS.APP_NAME,
      sourceVersion: __GRAPH_EXP_VERSION__,
      version: "1.0",
      timestamp: new Date(),
    },
    data: {
      connection: createExportedConnection(connection),
      vertices: vertexIds,
      edges: edgeIds,
    },
  };
}

/** Creates an exported connection object from the given connection config. */
export function createExportedConnection(
  connection: ConnectionConfig,
): ExportedGraphConnection {
  const dbUrl = (
    (connection.proxyConnection ? connection.graphDbUrl : connection.url) ?? ""
  ).toLowerCase();
  const queryEngine = connection.queryEngine ?? "gremlin";

  return {
    dbUrl: dbUrl,
    queryEngine: queryEngine,
  };
}

export async function parseExportedGraph(data: unknown) {
  const parsed = await exportedGraphSchema.parseAsync(data);

  const connection = parsed.data.connection;

  // Do some basic validation and skip any invalid IDs
  const vertices = new Set(
    parsed.data.vertices
      .values()
      .map(trimIfString)
      .filter(isNotEmptyIfString)
      .filter(isNotMaliciousIfSparql(connection.queryEngine))
      .map(escapeIfPropertyGraphAndString(connection.queryEngine))
      .map(createVertexId),
  );

  // Do some basic validation and skip any invalid IDs
  const edges = new Set(
    parsed.data.edges
      .values()
      .map(trimIfString)
      .filter(isNotEmptyIfString)
      .filter(isValidRdfEdgeIdIfSparql(connection.queryEngine))
      .map(escapeIfPropertyGraphAndString(connection.queryEngine))
      .map(createEdgeId),
  );

  return { connection, vertices, edges };
}

function isNotEmptyIfString(value: EntityRawId) {
  if (typeof value !== "string" || value.length > 0) {
    return true;
  }

  logger.warn("Skipping empty ID value", value);
  return false;
}

function isNotMaliciousIfSparql(queryEngine: QueryEngine) {
  // Ensure the ID is not malicious
  return (value: EntityRawId) => {
    if (
      queryEngine !== "sparql" ||
      typeof value !== "string" ||
      !value.includes(">")
    ) {
      return true;
    }

    logger.warn("Skipping edge ID because it includes angle brackets", value);
    return false;
  };
}

function isValidRdfEdgeIdIfSparql(queryEngine: QueryEngine) {
  return (value: EntityRawId) => {
    if (queryEngine !== "sparql") {
      return true;
    }

    if (typeof value !== "string") {
      logger.warn("Skipping edge ID because it is not a string", value);
      return false;
    }

    // Try to parse the edge ID
    const parsed = parseRdfEdgeIdString(value);

    // Ensure we can parse the edge ID
    if (!parsed) {
      logger.warn("Skipping edge ID because parsing failed", value);
      return false;
    }

    // Ensure the edge ID is not malicious
    if (
      parsed.source.includes(">") ||
      parsed.target.includes(">") ||
      parsed.predicate.includes(">")
    ) {
      logger.warn("Skipping edge ID because it includes angle brackets", {
        original: value,
        parsed,
      });
      return false;
    }

    return true;
  };
}

function trimIfString(value: EntityRawId) {
  return typeof value === "string" ? value.trim() : value;
}

function escapeIfPropertyGraphAndString(queryEngine: QueryEngine) {
  return (value: EntityRawId) =>
    queryEngine === "sparql" || typeof value !== "string"
      ? value
      : escapeString(value);
}

/** Compares the connection config to the exported connection. */
export function isMatchingConnection(
  connection: ConnectionConfig,
  exportedConnection: ExportedGraphConnection,
) {
  const compareTo = createExportedConnection(connection);
  return (
    compareTo.dbUrl === exportedConnection.dbUrl &&
    compareTo.queryEngine === exportedConnection.queryEngine
  );
}

export function createFileSafeTimestamp() {
  const now = new Date();

  // Format the date as YYYYMMDDHHMMSS
  const timestamp = now
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);

  return timestamp;
}

/** Creates a default file name for the given connection. */
export function createDefaultFileName(connectionName: string) {
  // Replace spaces with dashes, remove special characters other than hyphen, and convert to lowercase
  const modifiedConnectionName = connectionName
    .replace(/[^a-zA-Z0-9\s+]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  const timestamp = createFileSafeTimestamp();

  return `${modifiedConnectionName}.${timestamp}.graph.json`;
}
