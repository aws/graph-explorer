import { SPARQLBlankNodeNeighborsCountRequest } from "../../types";
import { query } from "@/utils";

/**
 * Count neighbors by class which are related with the given blank node sub-query.
 *
 * @example
 * subQuery = Blank node sub-query where the blank node was found
 * limit = 10
 *
 * SELECT ?bNode ?class (COUNT(?class) AS ?count) {
 *   SELECT DISTINCT ?bNode ?subject ?class {
 *     ?subject a ?class .
 *     { ?subject ?p ?bNode }
 *     UNION
 *     { ?bNode ?p ?subject }
 *     { < subQuery >}
 *   }
 *   LIMIT 10
 * }
 * GROUP BY ?bNode ?class
 */
export default function blankNodeNeighborsCountTemplate({
  subQuery,
  limit = 0,
}: SPARQLBlankNodeNeighborsCountRequest) {
  return query`
    # Count neighbors by class which are related with the given blank node sub-query
    SELECT ?bNode ?class (COUNT(?class) AS ?count) {
      ?subject a ?class {
        SELECT DISTINCT ?bNode ?subject ?class {
          ?subject a ?class .
          { ?subject ?p ?bNode }
          UNION
          { ?bNode ?p ?subject }
          { ${subQuery} }
        }
        ${limit > 0 ? `LIMIT ${limit}` : ""}
      }
    }
    GROUP BY ?bNode ?class
  `;
}
