import { vertexDetailsQuery } from "@/connector";
import { VertexId, Vertex, toNodeMap } from "@/core";
import { useQueryClient } from "@tanstack/react-query";

/** Fetch the details if the vertex is a fragment. */
export function useMaterializeVertices() {
  const queryClient = useQueryClient();

  return async (vertices: Map<VertexId, Vertex>) => {
    const responses = await Promise.all(
      vertices.values().map(async vertex => {
        if (!vertex.__isFragment) {
          return vertex;
        }

        const response = await queryClient.fetchQuery(
          vertexDetailsQuery(vertex.id)
        );
        return response.vertex;
      })
    );
    return toNodeMap(responses.filter(vertex => vertex != null));
  };
}
