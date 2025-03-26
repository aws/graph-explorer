import {
  Vertex,
  VertexId,
  createVertex,
  useDisplayVertexFromVertex,
} from "@/core";
import { useVertexDetailsQuery } from "./useVertexDetailsQuery";

/**
 * Returns a `DisplayVertex` instance for a given `VertexId` and `type`.
 *
 * If the vertex is not found in the cache, it will be created as a fragment. A
 * query will be executed to fetch the vertex details.
 */
export function useDisplayVertexFromFragment(
  id: VertexId,
  types: Vertex["types"]
) {
  const query = useVertexDetailsQuery(id);
  const vertex = query.data?.vertex ?? createVertex({ id, types });
  return useDisplayVertexFromVertex(vertex);
}
