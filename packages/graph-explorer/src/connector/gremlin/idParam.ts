import { EdgeRef, VertexRef } from "../useGEFetchTypes";

/** Formats the ID parameter for a gremlin query based on the ID type. */
export function idParam(entity: VertexRef | EdgeRef) {
  return entity.idType === "number" ? `${entity.id}L` : `"${entity.id}"`;
}
