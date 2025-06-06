import { EdgeDetailsRequest, edgeDetailsQuery } from "@/connector";
import { useExplorer, Edge, toEdgeMap, EdgeId } from "@/core";
import { useQueryClient } from "@tanstack/react-query";

/** Fetch the details if the edge is a fragment */
export function useMaterializeEdges() {
  const queryClient = useQueryClient();
  const explorer = useExplorer();

  return async (edges: Map<EdgeId, Edge>) => {
    const responses = await Promise.all(
      edges.values().map(async edge => {
        if (!edge.__isFragment) {
          return edge;
        }

        const request: EdgeDetailsRequest = {
          edgeId: edge.id,
        };
        const response = await queryClient.ensureQueryData(
          edgeDetailsQuery(request, explorer)
        );
        return response.edge;
      })
    );
    return toEdgeMap(responses.filter(edge => edge != null));
  };
}
