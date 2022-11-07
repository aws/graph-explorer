import type { NeighborsCountRequest } from "../../AbstractConnector";

/**
 * Count neighbors by type whose source is the given vertex.
 *
 * @example
 * vertexId = "http://www.example.com/soccer/resource#London_Stadium"
 * limit = 0
 *
 * SELECT ?vertexType (COUNT(?vertexType) AS ?total)
 * {
 *   ?target a ?vertexType
 *   {
 *     SELECT ?target
 *     {
 *       <http://www.example.com/soccer/resource#London_Stadium> ?edgeType ?target
 *     }
 *   }
 * }
 * GROUP BY ?vertexType
 */
const outgoingNeighborsCountTemplate = ({
  vertexId,
  limit = 500,
}: NeighborsCountRequest) => {
  let template = `SELECT ?vertexType (COUNT(?vertexType) AS ?total) {?target a ?vertexType {SELECT ?target {<${vertexId}> ?edgeType ?target } }} GROUP BY ?vertexType`;
  if (limit > 0) {
    template += `LIMIT ${limit}`;
  }
  return template;
};

export default outgoingNeighborsCountTemplate;
