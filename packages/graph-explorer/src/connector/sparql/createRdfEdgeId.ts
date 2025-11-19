import { createEdgeId, type VertexId } from "@/core";

/**
 * Combines the triple that makes up an edge into a single string.
 *
 * The format is:
 * {source}-[{predicate}]->{target}
 *
 * @param sourceId The source resource URI
 * @param predicate The predicate URI
 * @param targetId The target resource URI
 * @returns A string that represents the relationship between the source and target
 */
export function createRdfEdgeId(
  sourceId: string | VertexId,
  predicate: string,
  targetId: string | VertexId,
) {
  return createEdgeId(`${sourceId}-[${predicate}]->${targetId}`);
}
