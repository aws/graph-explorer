import { useQueries, useQuery } from "@tanstack/react-query";
import { useRecoilValue } from "recoil";
import { neighborsCountQuery, VertexRef } from "@/connector";
import { activeConnectionSelector, explorerSelector } from "@/core/connector";

export function useUpdateNodeCountsQuery(vertex: VertexRef) {
  const connection = useRecoilValue(activeConnectionSelector);
  const explorer = useRecoilValue(explorerSelector);
  return useQuery(
    neighborsCountQuery(vertex, connection?.nodeExpansionLimit, explorer)
  );
}

export function useAllNeighborCountsQuery(vertexIds: VertexRef[]) {
  const connection = useRecoilValue(activeConnectionSelector);
  const explorer = useRecoilValue(explorerSelector);

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
