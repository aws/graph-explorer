import type { SchemaStorageModel } from "@/core";

import { isCancellationError } from "@/utils";

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
  // A cancelled discovery is the user's choice, not a failure to report.
  const failure = isCancellationError(error) ? null : error;
  if (failure != null || schema.lastEdgeConnectionSyncFail) {
    return { kind: "failed", error: failure };
  }
  if (schema.edgeConnections == null) {
    return { kind: "not-discovered" };
  }
  return null;
}
