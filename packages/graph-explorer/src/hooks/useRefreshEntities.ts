import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";

import type { EdgeId, VertexId } from "@/core";

import { bulkEdgeDetailsQuery, bulkVertexDetailsQuery } from "@/connector";

export function useRefreshEntities() {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const refresh = (entityIds: { vertexIds: VertexId[]; edgeIds: EdgeId[] }) => {
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
