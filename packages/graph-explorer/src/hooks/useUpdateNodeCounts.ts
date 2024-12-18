import { useQueries, useQuery } from "@tanstack/react-query";
import { useRecoilValue } from "recoil";
import { neighborsCountQuery } from "@/connector/queries";
import { activeConnectionSelector, explorerSelector } from "@/core/connector";
import { VertexRef } from "@/connector/useGEFetchTypes";

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
  });
}
