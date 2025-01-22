import { query } from "@/utils";
import type { NeighborsCountRequest } from "@/connector/useGEFetchTypes";

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
  vertex,
  limit = 0,
}: NeighborsCountRequest) {
  return query`
      MATCH (v)-[]-(neighbor)
      WHERE ID(v) = "${vertex.id}" 
      WITH DISTINCT neighbor
      ${limit > 0 ? `LIMIT ${limit}` : ``}
      RETURN labels(neighbor) AS vertexLabel, count(DISTINCT neighbor) AS count
    `;
}