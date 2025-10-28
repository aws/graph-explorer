import { queryOptions } from "@tanstack/react-query";
import type { VertexId } from "@/core";
import { getExplorer } from "./helpers";

export function vertexDetailsQuery(vertexId: VertexId) {
  return queryOptions({
    queryKey: ["vertex", vertexId],
    queryFn: async ({ signal, meta }) => {
      const explorer = getExplorer(meta);
      const results = await explorer.vertexDetails(
        { vertexIds: [vertexId] },
        { signal }
      );

      if (!results.vertices.length) {
        return { vertex: null };
      }

      return { vertex: results.vertices[0] };
    },
  });
}
