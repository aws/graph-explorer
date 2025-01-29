import { useQueries, useQuery } from "@tanstack/react-query";
import { neighborsCountQuery } from "@/connector";
import { useExplorer } from "@/core/connector";
import { VertexId } from "@/core";

export function useUpdateNodeCountsQuery(vertexId: VertexId) {
  const explorer = useExplorer();
  return useQuery(neighborsCountQuery({ vertexId }, explorer));
}

export function useAllNeighborCountsQuery(vertexIds: VertexId[]) {
  const explorer = useExplorer();

  return useQueries({
    queries: vertexIds.map(vertexId =>
      neighborsCountQuery({ vertexId }, explorer)
    ),
    combine: results => ({
      data: results.map(result => result.data),
      pending: results.some(result => result.isPending),
      errors: results.map(result => result.error),
      hasErrors: results.some(result => result.isError),
    }),
  });
}
