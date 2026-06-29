import {
  type ConnectionConfig,
  type QueryEngine,
  queryEngineOptions,
} from "@shared/types";
import { z } from "zod";

import type { FileEnvelope } from "@/core/fileEnvelope";

import { parseRdfEdgeIdString } from "@/connector/sparql/parseEdgeId";
import {
  createEdgeId,
  createVertexId,
  type EdgeId,
  type EntityRawId,
  type VertexId,
} from "@/core/entities";
import { createFileEnvelope, parseFileEnvelope } from "@/core/fileEnvelope";
import { escapeString, logger } from "@/utils";

/** The envelope `kind` discriminator for graph export files. */
export const GRAPH_EXPORT_KIND = "graph-export";

/**
 * Payload schema version. Bump the major for a breaking change; bump the minor
 * for additive changes that older readers can safely ignore.
 */
export const GRAPH_EXPORT_VERSION = "1.0";
export const GRAPH_EXPORT_MAJOR_VERSION = 1;

const graphExportPayloadSchema = z.object({
  connection: z.object({
    dbUrl: z.string(),
    queryEngine: z.enum(queryEngineOptions),
  }),
  vertices: z.array(z.union([z.string(), z.number()])),
  edges: z.array(z.union([z.string(), z.number()])),
});

export type GraphExportPayload = z.infer<typeof graphExportPayloadSchema>;
export type ExportedGraphFile = FileEnvelope<GraphExportPayload>;
export type ExportedGraphConnection = GraphExportPayload["connection"];

/** Creates an exported graph suitable for saving to a file. */
export function createExportedGraph(
  vertexIds: VertexId[],
  edgeIds: EdgeId[],
  connection: ConnectionConfig,
): ExportedGraphFile {
  return createFileEnvelope(GRAPH_EXPORT_KIND, GRAPH_EXPORT_VERSION, {
    connection: createExportedConnection(connection),
    vertices: vertexIds,
    edges: edgeIds,
  });
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

/**
 * Reads a graph export file: validates the shared envelope (kind + major
 * version), then the graph payload, then sanitizes the entity ids. Throws
 * {@link FileEnvelopeError} for a non-graph or too-new file and {@link ZodError}
 * for a malformed payload.
 */
export async function parseExportedGraph(blob: Blob) {
  const envelope = await parseFileEnvelope(blob, {
    kind: GRAPH_EXPORT_KIND,
    supportedMajorVersion: GRAPH_EXPORT_MAJOR_VERSION,
  });
  const payload = graphExportPayloadSchema.parse(envelope.data);

  const connection = payload.connection;

  // Do some basic validation and skip any invalid IDs
  const vertices = new Set(
    payload.vertices
      .values()
      .map(trimIfString)
      .filter(isNotEmptyIfString)
      .filter(isNotMaliciousIfSparql(connection.queryEngine))
      .map(escapeIfPropertyGraphAndString(connection.queryEngine))
      .map(createVertexId),
  );

  // Do some basic validation and skip any invalid IDs
  const edges = new Set(
    payload.edges
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
