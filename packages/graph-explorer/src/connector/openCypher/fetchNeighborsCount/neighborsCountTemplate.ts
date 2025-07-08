import { query } from "@/utils";
import type { NeighborCountsRequest } from "@/connector/useGEFetchTypes";
import { idParam } from "../idParam";

/**
 * Given a single nodes id, it returns an OpenCypher template with
 * all neighbors types with their counts.
 *
 * @example
 * ids = "44"
 * limit = 10
 *
 * MATCH (v) -[]- (neighbor)
 * WHERE ID(v) = "44"
 * WITH DISTINCT neighbor LIMIT 500
 * RETURN labels(t) AS vertexLabel, count(neighbor) AS count
 *
 */
export default function neighborsCountTemplate({
  vertexId,
}: NeighborCountsRequest) {
  return query`
      MATCH (v)-[]-(neighbor)
      WHERE ID(v) = ${idParam(vertexId)}
      WITH DISTINCT neighbor
      RETURN labels(neighbor) AS vertexLabel, count(DISTINCT neighbor) AS count
    `;
}
