import { EdgeId, getRawId, VertexId } from "@/core";

/** Formats the ID parameter for a sparql query based on the ID type. */
export function idParam(id: VertexId | EdgeId) {
  const rawId = getRawId(id);
  if (typeof rawId !== "string") {
    throw new Error("ID must be a URI");
  }
  return `<${rawId}>`;
}
