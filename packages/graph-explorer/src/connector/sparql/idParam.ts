import type { EdgeId, VertexId } from "@/core";

/**
 * Formats the ID parameter for a sparql query based on the ID type.
 *
 * @deprecated Use the fragment constructors in `./fragments` instead.
 */
export function idParam(id: VertexId | EdgeId | string) {
  if (typeof id !== "string") {
    throw new Error("ID must be a URI");
  }
  return `<${id}>`;
}
