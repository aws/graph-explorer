import { QueryClient, queryOptions } from "@tanstack/react-query";
import { NeighborCount } from "../useGEFetchTypes";
import { VertexId } from "@/core";
import { DEFAULT_BATCH_REQUEST_SIZE } from "@/utils";
import { chunk } from "lodash";
import { getExplorer, updateNeighborCountCache } from "./helpers";
import { neighborsCountQuery } from "./neighborsCountQuery";

export function bulkNeighborCountsQuery(
  vertexIds: VertexId[],
  queryClient: QueryClient
) {
  return queryOptions({
    queryKey: ["vertices", vertexIds, "neighbor", "count"],
    staleTime: 0,
    gcTime: 0,
    queryFn: async ({ signal, meta, client }) => {
      // Bail early if request is empty
      if (!vertexIds.length) {
        return [];
      }

      const explorer = getExplorer(meta);

      // Get cached and missing IDs in one pass
      const responses: NeighborCount[] = [];
      const missingIds: VertexId[] = [];

      for (const id of vertexIds) {
        const cached = client.getQueryData(neighborsCountQuery(id).queryKey);
        if (cached) {
          responses.push(cached);
        } else {
          missingIds.push(id);
        }
      }

      // Bail early if all responses are cached
      if (!missingIds.length) {
        return responses;
      }

      // Fetch missing neighbor counts in batches
      const newResponses = await Promise.all(
        chunk(missingIds, DEFAULT_BATCH_REQUEST_SIZE).map(batch =>
          explorer
            .neighborCounts({ vertexIds: batch }, { signal })
            .then(r => r.counts)
        )
      ).then(results => results.flat());

      // Update cache and combine responses
      updateNeighborCountCache(client, newResponses);

      return [...responses, ...newResponses];
    },
    placeholderData: vertexIds
      .map(id => queryClient.getQueryData(neighborsCountQuery(id).queryKey))
      .filter(c => c != null),
  });
}
