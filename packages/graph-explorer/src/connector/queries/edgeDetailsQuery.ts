import { queryOptions } from "@tanstack/react-query";
import { getExplorer } from "./helpers";
import { type EdgeId } from "@/core";

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
