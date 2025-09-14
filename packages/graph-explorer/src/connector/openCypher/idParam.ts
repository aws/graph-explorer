import { type EdgeId, getRawId, type VertexId } from "@/core";

/** Formats the ID parameter for an openCypher query based on the ID type. */
export function idParam(id: VertexId | EdgeId) {
  const rawId = getRawId(id);
  if (typeof rawId !== "string") {
    throw new Error(`Invalid ID type: ${typeof rawId}`);
  }
  return `"${rawId}"`;
}
