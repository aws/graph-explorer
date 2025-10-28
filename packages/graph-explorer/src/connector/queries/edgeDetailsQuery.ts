import { queryOptions } from "@tanstack/react-query";
import type { EdgeId } from "@/core";
import { getExplorer } from "./helpers";

export function edgeDetailsQuery(edgeId: EdgeId) {
  return queryOptions({
    queryKey: ["edge", edgeId],
    queryFn: async ({ signal, meta }) => {
      const explorer = getExplorer(meta);
      const results = await explorer.edgeDetails(
        { edgeIds: [edgeId] },
        { signal }
      );

      if (!results.edges.length) {
        return { edge: null };
      }

      return { edge: results.edges[0] };
    },
  });
}
