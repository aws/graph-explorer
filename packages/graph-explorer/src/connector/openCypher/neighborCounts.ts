import { query } from "@/utils";
import {
  NeighborCount,
  NeighborCountsRequest,
  NeighborCountsResponse,
} from "../useGEFetchTypes";
import { idParam } from "./idParam";
import { OpenCypherFetch } from "./types";
import isErrorResponse from "../utils/isErrorResponse";
import { parseResults } from "./mappers/mapResults";
import { createVertexId, EntityRawId } from "@/core";

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
      count(labels(neighbor)) AS neighborCount
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
      countsByType[count.label.join("::")] = count.count;
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
