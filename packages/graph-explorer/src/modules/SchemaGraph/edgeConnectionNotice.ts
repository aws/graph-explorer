import type { SchemaStorageModel } from "@/core";

/**
 * What, if anything, the Schema view should tell the user about edge
 * connection discovery for the active schema.
 */
export type EdgeConnectionNotice =
  | { kind: "failed"; error: Error | null }
  | { kind: "not-discovered" }
  | null;

/**
 * Resolves the edge connection notice from the persisted failure flag and the
 * live discovery query's error, never from `edgeConnections` alone: exploring
 * the graph after a failure can add partial connections, and those must still
 * surface the failure rather than look like a clean, empty result.
 */
export function edgeConnectionNotice(
  schema: SchemaStorageModel,
  error: Error | null,
): EdgeConnectionNotice {
  if (error != null || schema.lastEdgeConnectionSyncFail) {
    return { kind: "failed", error };
  }
  if (schema.edgeConnections == null) {
    return { kind: "not-discovered" };
  }
  return null;
}
