import { query } from "@/utils";
import type {
  NeighborCount,
  NeighborCountsRequest,
  NeighborCountsResponse,
} from "../useGEFetchTypes";
import { idParam } from "./idParam";
import type { OpenCypherFetch } from "./types";
import isErrorResponse from "../utils/isErrorResponse";
import { parseResults } from "./mappers/mapResults";
import { createVertexId, type EntityRawId } from "@/core";

export async function neighborCounts(
  openCypherFetch: OpenCypherFetch,
  request: NeighborCountsRequest
): Promise<NeighborCountsResponse> {
  // Bail early if request is empty
  if (!request.vertexIds.length) {
    return { counts: [] };
  }

  const ids = request.vertexIds.map(idParam).join(",");
  const template = query`
    MATCH (source)--(neighbor)
    WHERE id(source) IN [${ids}]
    WITH DISTINCT source, neighbor
    WITH 
      id(source) AS id, 
      labels(neighbor) AS neighborLabels, 
      count(neighbor) AS neighborCount
    RETURN id, collect({ label: neighborLabels, count: neighborCount }) as counts
  `;

  // Fetch the vertex details
  const data = await openCypherFetch(template);
  if (isErrorResponse(data)) {
    throw new Error(data.detailedMessage);
  }

  // Map the results
  const vertices = parseResults(data);

  const counts: NeighborCount[] = [];
  for (const result of vertices) {
    const rawId = result["id"] as EntityRawId;
    const rawCounts = result["counts"] as Array<{
      label: string[];
      count: number;
    }>;

    if (!rawId || !rawCounts) {
      continue;
    }

    const vertexId = createVertexId(rawId);

    // Total up neighbors by type (might be more than unique neighbors)
    const countsByType: Record<string, number> = {};
    for (const count of rawCounts) {
      for (const type of count.label) {
        countsByType[type] = (countsByType[type] ?? 0) + count.count;
      }
    }

    // Total up the unique neighbors
    const totalCount = rawCounts.reduce((acc, count) => acc + count.count, 0);

    counts.push({
      vertexId,
      counts: countsByType,
      totalCount,
    });
  }

  return { counts };
}
