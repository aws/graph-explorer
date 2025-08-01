import { queryOptions } from "@tanstack/react-query";
import { Edge, EdgeId } from "@/core";
import { DEFAULT_BATCH_REQUEST_SIZE } from "@/utils";
import { chunk } from "lodash";
import { getExplorer, updateEdgeDetailsCache } from "./helpers";
import { edgeDetailsQuery } from "./edgeDetailsQuery";

export function bulkEdgeDetailsQuery(edgeIds: EdgeId[]) {
  return queryOptions({
    queryKey: ["edges", edgeIds],
    staleTime: 0,
    gcTime: 0,
    queryFn: async ({ client, meta, signal }) => {
      const explorer = getExplorer(meta);

      // Get cached and missing edges in one pass
      const cachedEdges: Edge[] = [];
      const missingIds: EdgeId[] = [];

      for (const id of edgeIds) {
        const cached = client.getQueryData(edgeDetailsQuery(id).queryKey)?.edge;
        if (cached) {
          cachedEdges.push(cached);
        } else {
          missingIds.push(id);
        }
      }

      // Return early if all edges are cached
      if (!missingIds.length) {
        return { edges: cachedEdges };
      }

      // Fetch missing edges in batches
      const edges = await Promise.all(
        chunk(missingIds, DEFAULT_BATCH_REQUEST_SIZE).map(batch =>
          explorer
            .edgeDetails({ edgeIds: batch }, { signal })
            .then(r => r.edges)
        )
      ).then(results => results.flat());

      // Update cache
      updateEdgeDetailsCache(client, edges);

      return { edges: [...cachedEdges, ...edges] };
    },
  });
}
