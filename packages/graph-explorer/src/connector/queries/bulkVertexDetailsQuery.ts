import { queryOptions } from "@tanstack/react-query";
import { type Vertex, type VertexId } from "@/core";
import { DEFAULT_BATCH_REQUEST_SIZE } from "@/utils";
import { chunk } from "lodash";
import { getExplorer, setVertexDetailsQueryCache } from "./helpers";
import { vertexDetailsQuery } from "./vertexDetailsQuery";

export function bulkVertexDetailsQuery(vertexIds: VertexId[]) {
  return queryOptions({
    queryKey: ["vertices", vertexIds],
    staleTime: 0,
    gcTime: 0,
    queryFn: async ({ client, meta, signal }) => {
      const explorer = getExplorer(meta);

      // Get cached and missing vertices in one pass
      const cachedVertices: Vertex[] = [];
      const missingIds: VertexId[] = [];

      for (const id of vertexIds) {
        const cached = client.getQueryData(
          vertexDetailsQuery(id).queryKey
        )?.vertex;
        if (cached) {
          cachedVertices.push(cached);
        } else {
          missingIds.push(id);
        }
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

      return { vertices: [...cachedVertices, ...vertices] };
    },
  });
}
