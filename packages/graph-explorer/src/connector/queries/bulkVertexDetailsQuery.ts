import { queryOptions } from "@tanstack/react-query";
import type { Vertex, VertexId } from "@/core";
import { DEFAULT_BATCH_REQUEST_SIZE } from "@/utils";
import { chunk } from "lodash";
import {
  getExplorer,
  getStore,
  setVertexDetailsQueryCache,
  updateVertexGraphCanvasState,
} from "./helpers";
import { vertexDetailsQuery } from "./vertexDetailsQuery";

export function bulkVertexDetailsQuery(
  vertexIds: VertexId[],
  options?: { ignoreCache: boolean }
) {
  return queryOptions({
    queryKey: ["vertices", vertexIds, options],
    staleTime: 0,
    gcTime: 0,
    queryFn: async ({ client, meta, signal }) => {
      const explorer = getExplorer(meta);
      const store = getStore(meta);

      const shouldIgnoreCache = options?.ignoreCache ?? false;

      // Get cached and missing vertices in one pass
      const cachedVertices: Vertex[] = [];
      const missingIds: VertexId[] = [];

      if (!shouldIgnoreCache) {
        vertexIds.forEach(id => {
          const cached = client.getQueryData(
            vertexDetailsQuery(id).queryKey
          )?.vertex;
          if (cached) {
            cachedVertices.push(cached);
          } else {
            missingIds.push(id);
          }
        });
      } else {
        missingIds.push(...vertexIds);
      }

      // Return early if all vertices are cached
      if (!missingIds.length) {
        return { vertices: cachedVertices };
      }

      // Fetch missing vertices in batches
      const vertices = await Promise.all(
        chunk(missingIds, DEFAULT_BATCH_REQUEST_SIZE).map(batch =>
          explorer
            .vertexDetails({ vertexIds: batch }, { signal })
            .then(r => r.vertices)
        )
      ).then(results => results.flat());

      // Update cache
      vertices.forEach(v => setVertexDetailsQueryCache(client, v));
      updateVertexGraphCanvasState(store, vertices);

      return { vertices: [...cachedVertices, ...vertices] };
    },
  });
}
