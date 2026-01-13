import { queryOptions } from "@tanstack/react-query";
import { chunk } from "lodash";

import type { Edge, EdgeId } from "@/core";

import { DEFAULT_BATCH_REQUEST_SIZE } from "@/utils";

import { edgeDetailsQuery } from "./edgeDetailsQuery";
import {
  getExplorer,
  getStore,
  setEdgeDetailsQueryCache,
  updateEdgeGraphCanvasState,
} from "./helpers";

export function bulkEdgeDetailsQuery(
  edgeIds: EdgeId[],
  options?: { ignoreCache: boolean },
) {
  return queryOptions({
    queryKey: ["edges", edgeIds, options],
    staleTime: 0,
    gcTime: 0,
    queryFn: async ({ client, meta, signal }) => {
      const explorer = getExplorer(meta);
      const store = getStore(meta);

      const shouldIgnoreCache = options?.ignoreCache ?? false;

      // Get cached and missing edges in one pass
      const cachedEdges: Edge[] = [];
      const missingIds: EdgeId[] = [];

      if (!shouldIgnoreCache) {
        edgeIds.forEach(id => {
          const cached = client.getQueryData(
            edgeDetailsQuery(id).queryKey,
          )?.edge;
          if (cached) {
            cachedEdges.push(cached);
          } else {
            missingIds.push(id);
          }
        });
      } else {
        missingIds.push(...edgeIds);
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
            .then(r => r.edges),
        ),
      ).then(results => results.flat());

      // Update cache
      edges.forEach(e => setEdgeDetailsQueryCache(client, e));
      updateEdgeGraphCanvasState(store, edges);

      return { edges: [...cachedEdges, ...edges] };
    },
  });
}
