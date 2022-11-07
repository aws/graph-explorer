import type { NeighborsCountRequest } from "../../AbstractConnector";

/**
 * Count neighbors by type whose target is the given vertex.
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
 *       ?target ?edgeType <http://www.example.com/soccer/resource#London_Stadium>
 *     }
 *   }
 * }
 * GROUP BY ?vertexType
 */
const incomingNeighborsCountTemplate = ({
  vertexId,
  limit = 500,
}: NeighborsCountRequest) => {
  let template = `SELECT ?vertexType (COUNT(?vertexType) AS ?total) {?start a ?vertexType {SELECT ?start {?start ?edgeType <${vertexId}>}`;
  if (limit > 0) {
    template += `LIMIT ${limit}`;
  }
  template += `}} GROUP BY ?vertexType`;

  return template;
};

export default incomingNeighborsCountTemplate;
