import { useQueries, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { neighborsCountQuery } from "@/connector";
import { VertexId } from "@/core";

export function useUpdateNodeCountsQuery(vertexId: VertexId) {
  return useQuery(neighborsCountQuery({ vertexId }));
}

export function useUpdateNodeCountsSuspenseQuery(vertexId: VertexId) {
  return useSuspenseQuery(neighborsCountQuery({ vertexId }));
}

export function useAllNeighborCountsQuery(vertexIds: VertexId[]) {
  return useQueries({
    queries: vertexIds.map(vertexId => neighborsCountQuery({ vertexId })),
    combine: results => ({
      data: results.map(result => result.data),
      pending: results.some(result => result.isPending),
      errors: results.map(result => result.error),
      hasErrors: results.some(result => result.isError),
    }),
  });
}
