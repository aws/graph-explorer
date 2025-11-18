import { bulkVertexDetailsQuery, bulkEdgeDetailsQuery } from "@/connector";
import type { VertexId, EdgeId } from "@/core";
import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";

export function useRefreshEntities(entityIds: {
  vertexIds: VertexId[];
  edgeIds: EdgeId[];
}) {
  const queryClient = useQueryClient();

  const [isPending, startTransition] = useTransition();

  const refresh = () => {
    startTransition(async () => {
      await Promise.all([
        queryClient.prefetchQuery({
          ...bulkVertexDetailsQuery(entityIds.vertexIds, { ignoreCache: true }),
          staleTime: 0,
        }),
        queryClient.prefetchQuery({
          ...bulkEdgeDetailsQuery(entityIds.edgeIds, { ignoreCache: true }),
          staleTime: 0,
        }),
      ]);
    });
  };

  return {
    refresh,
    isPending,
  };
}
