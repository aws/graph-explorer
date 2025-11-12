import { queryOptions } from "@tanstack/react-query";
import type { EdgeId } from "@/core";
import { getExplorer, getStore, updateEdgeGraphCanvasState } from "./helpers";

export function edgeDetailsQuery(edgeId: EdgeId) {
  return queryOptions({
    queryKey: ["edge", edgeId],
    queryFn: async ({ signal, meta }) => {
      const explorer = getExplorer(meta);
      const store = getStore(meta);
      const results = await explorer.edgeDetails(
        { edgeIds: [edgeId] },
        { signal }
      );

      const edge = results.edges[0] ?? null;

      if (edge) {
        updateEdgeGraphCanvasState(store, [edge]);
      }

      return { edge };
    },
  });
}
