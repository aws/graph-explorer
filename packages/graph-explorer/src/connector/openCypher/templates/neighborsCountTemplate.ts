import type { NeighborsCountRequest } from "../../AbstractConnector";

/**
 * Given a single node ids, it returns a Gremlin template with
 * all neighbors types with their counts.
 *
 * @example
 * ids = "44"
 * limit = 10
 *
 * g.V("44").both().limit(10).dedup()
 *  .group().by(label).by(count())
 */
const neighborsCountTemplate = ({
  vertexId,
  limit = 500,
}: NeighborsCountRequest) => {
  return `MATCH (v) -[e]- (t) WHERE ID(v) = \"${vertexId}\" RETURN labels(t) AS vertexLabel, count(DISTINCT t) AS count LIMIT ${limit}`;
};

export default neighborsCountTemplate;
