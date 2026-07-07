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
import {
  createFileEnvelope,
  type EnvelopeVersion,
  FileEnvelopeError,
  parseFileEnvelope,
} from "@/core/fileEnvelope";
import { escapeString, logger } from "@/utils";

/** The envelope `kind` discriminator for graph export files. */
export const GRAPH_EXPORT_KIND = "graph-export";

/**
 * Format generation. A single integer that bumps only on a breaking change
 * (renamed or removed fields). Additive changes are made as optional fields and
 * do not bump it. This is the newest generation this build can read, and the
 * value the version dispatch switches on after the envelope normalizes the
 * wire form.
 */
export const GRAPH_EXPORT_VERSION = 1;

/**
 * The version value written into new graph-export files. Generation 1 is
 * stamped as the `"1.0"` decimal string rather than the integer `1` so that
 * builds predating the integer switch — which validate `version` as the
 * literal `"1.0"` — can still import files this build writes. The envelope
 * normalizes both forms to {@link GRAPH_EXPORT_VERSION} on read. See the
 * shared-file-envelope ADR.
 */
export const GRAPH_EXPORT_WIRE_VERSION: EnvelopeVersion = "1.0";

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
  return createFileEnvelope(GRAPH_EXPORT_KIND, GRAPH_EXPORT_WIRE_VERSION, {
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
 * Selects the payload parser for a graph export file's format generation. Today
 * only generation 1 exists; a future breaking change adds its `case` here
 * alongside the old one. Routing through an explicit switch means a generation
 * with no parser fails loudly instead of being mis-parsed by the current schema.
 * The envelope's version guard already rejects a generation newer than this
 * build supports, so the `default` is reached only when a supported generation
 * is left unhandled here — a programming error, surfaced rather than swallowed.
 */
export function parseGraphExportPayloadForVersion(
  version: number,
  rawData: unknown,
): GraphExportPayload {
  switch (version) {
    case 1:
      return graphExportPayloadSchema.parse(rawData);
    default:
      throw new FileEnvelopeError(
        `No graph export parser for format generation ${version}`,
      );
  }
}

/**
 * Reads a graph export file: validates the shared envelope (kind + format
 * generation), then the graph payload, then sanitizes the entity ids. Throws
 * {@link FileEnvelopeError} for a non-graph or too-new file and {@link ZodError}
 * for a malformed payload.
 */
export async function parseExportedGraph(blob: Blob) {
  const envelope = await parseFileEnvelope(blob, {
    kind: GRAPH_EXPORT_KIND,
    supportedVersion: GRAPH_EXPORT_VERSION,
  });
  const payload = parseGraphExportPayloadForVersion(
    envelope.meta.version,
    envelope.data,
  );

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
