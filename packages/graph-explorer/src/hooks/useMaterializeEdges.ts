import { edgeDetailsQuery } from "@/connector";
import { Edge, toEdgeMap, EdgeId } from "@/core";
import { useQueryClient } from "@tanstack/react-query";

/** Fetch the details if the edge is a fragment */
export function useMaterializeEdges() {
  const queryClient = useQueryClient();

  return async (edges: Map<EdgeId, Edge>) => {
    const responses = await Promise.all(
      edges.values().map(async edge => {
        if (!edge.__isFragment) {
          return edge;
        }

        const response = await queryClient.ensureQueryData(
          edgeDetailsQuery(edge.id)
        );
        return response.edge;
      })
    );
    return toEdgeMap(responses.filter(edge => edge != null));
  };
}
