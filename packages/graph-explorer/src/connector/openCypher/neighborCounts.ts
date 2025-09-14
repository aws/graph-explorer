import { query } from "@/utils";
import {
  type NeighborCount,
  type NeighborCountsRequest,
  type NeighborCountsResponse,
} from "../useGEFetchTypes";
import { idParam } from "./idParam";
import { type OpenCypherFetch } from "./types";
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
    const countsByType: Record<string, number> = {};
    for (const count of rawCounts) {
      // TODO: In a future set of changes we should pass the full lsit of types
      // up to the UI so that it can list them out properly, but since this is a
      // rather large change I am defering that work.
      const type = count.label[0] ?? "";
      countsByType[type] = count.count;
    }
    const totalCount = rawCounts.reduce((acc, count) => acc + count.count, 0);

    counts.push({
      vertexId,
      counts: countsByType,
      totalCount,
    });
  }

  return { counts };
}
