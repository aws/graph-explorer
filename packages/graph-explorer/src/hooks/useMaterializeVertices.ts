import { VertexDetailsRequest, vertexDetailsQuery } from "@/connector";
import { useExplorer, VertexId, Vertex, toNodeMap } from "@/core";
import { useQueryClient } from "@tanstack/react-query";

/** Fetch the details if the vertex is a fragment. */
export function useMaterializeVertices() {
  const queryClient = useQueryClient();
  const explorer = useExplorer();

  return async (vertices: Map<VertexId, Vertex>) => {
    const responses = await Promise.all(
      vertices.values().map(async vertex => {
        if (!vertex.__isFragment) {
          return vertex;
        }

        const request: VertexDetailsRequest = {
          vertexId: vertex.id,
        };
        const response = await queryClient.ensureQueryData(
          vertexDetailsQuery(request, explorer)
        );
        return response.vertex;
      })
    );
    return toNodeMap(responses.filter(vertex => vertex != null));
  };
}
