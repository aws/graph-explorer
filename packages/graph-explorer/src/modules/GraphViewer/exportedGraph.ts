import { createVertexId, createEdgeId, EdgeId, VertexId } from "@/core";
import { APP_NAME } from "@/utils";
import { ConnectionConfig, queryEngineOptions } from "@shared/types";
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
    vertices: z
      .array(z.union([z.string(), z.number()]))
      .transform(ids => ids.map(id => createVertexId(id))),
    edges: z
      .array(z.union([z.string(), z.number()]))
      .transform(ids => ids.map(id => createEdgeId(id))),
  }),
});

export type ExportedGraph = z.infer<typeof exportedGraphSchema>;
export type ExportedGraphConnection = ExportedGraph["data"]["connection"];

/** Creates an exported graph suitable for saving to a file. */
export function createExportedGraph(
  vertexIds: VertexId[],
  edgeIds: EdgeId[],
  connection: ConnectionConfig
): ExportedGraph {
  return {
    meta: {
      kind: "graph-export",
      source: APP_NAME,
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
  connection: ConnectionConfig
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

/** Compares the connection config to the exported connection. */
export function isMatchingConnection(
  connection: ConnectionConfig,
  exportedConnection: ExportedGraphConnection
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
