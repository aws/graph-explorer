import type { Branded } from "@/utils";

import { createEdgeType, createVertexType, type EdgeConnection } from "@/core";

/** Branded type for edge connection IDs used in Cytoscape */
export type EdgeConnectionId = Branded<string, "EdgeConnectionId">;

/**
 * Creates a unique identifier for an edge connection in the format:
 * `sourceVertexType-[edgeType]->targetVertexType`
 *
 * Used as the Cytoscape edge ID in the schema graph visualization.
 */
export function createEdgeConnectionId({
  sourceVertexType,
  edgeType,
  targetVertexType,
}: EdgeConnection): EdgeConnectionId {
  return `${sourceVertexType}-[${edgeType}]->${targetVertexType}` as EdgeConnectionId;
}

/**
 * Parses an edge connection ID back into its component parts.
 *
 * @param edgeId - Edge ID in format `sourceVertexType-[edgeType]->targetVertexType`
 * @returns Parsed edge connection or null if format is invalid
 */
export function parseEdgeConnectionId(edgeId: EdgeConnectionId) {
  // Format: "sourceLabel-[edgeType]->targetLabel"
  const match = edgeId.match(/^(.+)-\[(.+)\]->(.+)$/);
  if (!match) return null;
  return {
    sourceVertexType: createVertexType(match[1]),
    edgeType: createEdgeType(match[2]),
    targetVertexType: createVertexType(match[3]),
  };
}
