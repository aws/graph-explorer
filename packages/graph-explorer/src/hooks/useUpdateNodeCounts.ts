import { useQueries, useQuery } from "@tanstack/react-query";
import { useRecoilValue } from "recoil";
import { neighborsCountQuery } from "@/connector";
import { activeConnectionSelector, useExplorer } from "@/core/connector";
import { VertexId } from "@/core";

export function useUpdateNodeCountsQuery(vertexId: VertexId) {
  const connection = useRecoilValue(activeConnectionSelector);
  const explorer = useExplorer();
  return useQuery(
    neighborsCountQuery(vertexId, connection?.nodeExpansionLimit, explorer)
  );
}

export function useAllNeighborCountsQuery(vertexIds: VertexId[]) {
  const connection = useRecoilValue(activeConnectionSelector);
  const explorer = useExplorer();

  return useQueries({
    queries: vertexIds.map(vertex =>
      neighborsCountQuery(vertex, connection?.nodeExpansionLimit, explorer)
    ),
    combine: results => ({
      data: results.map(result => result.data),
      pending: results.some(result => result.isPending),
      errors: results.map(result => result.error),
      hasErrors: results.some(result => result.isError),
    }),
  });
}
