import { type EdgeId, getRawId, type VertexId } from "@/core";

/** Formats the ID parameter for a gremlin query based on the ID type. */
export function idParam(entityId: VertexId | EdgeId) {
  const rawId = getRawId(entityId);
  return typeof rawId === "number" ? `${rawId}L` : `"${rawId}"`;
}
