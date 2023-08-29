import type { NeighborsCountRequest } from "../../AbstractConnector";

/**
 * Given a single nodes id, it returns an OpenCypher template with
 * all neighbors types with their counts.
 *
 * @example
 * ids = "44"
 * limit = 10
 *
 * MATCH (v) -[e]- (t) 
 * WHERE ID(v) = "44" 
 * RETURN labels(t) AS vertexLabel, count(DISTINCT t) AS count 
 * LIMIT 10
 * 
 */
const neighborsCountTemplate = ({
  vertexId,
  limit = 500,
}: NeighborsCountRequest) => {
  let template = "";
  template = `MATCH (v) -[e]- (t) WHERE ID(v) = \"${vertexId}\" RETURN labels(t) AS vertexLabel, count(DISTINCT t) AS count`;

  if (limit > 0) {
    template += ` LIMIT ${limit}`;
  }

  return template;
};

export default neighborsCountTemplate;
