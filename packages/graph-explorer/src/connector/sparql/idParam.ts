import { EdgeId, getRawId, VertexId } from "@/core";

/** Formats the ID parameter for a sparql query based on the ID type. */
export function idParam(id: VertexId | EdgeId) {
  return `<${getRawId(id)}>`;
}
