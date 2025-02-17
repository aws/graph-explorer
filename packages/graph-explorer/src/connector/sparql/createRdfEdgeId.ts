import { createEdgeId, VertexId } from "@/core";

/**
 * Combines the triple that makes up an edge into a single string.
 *
 * The format is:
 * {source}-[{predicate}]->{target}
 *
 * @param source The source resource URI
 * @param predicate The predicate URI
 * @param target The target resource URI
 * @returns A string that represents the relationship between the source and target
 */
export function createRdfEdgeId(
  source: string | VertexId,
  predicate: string,
  target: string | VertexId
) {
  return createEdgeId(`${source}-[${predicate}]->${target}`);
}
