import { query } from "@/utils";
import { SPARQLNeighborsCountRequest } from "../types";
import { idParam } from "../idParam";

/**
 * Count neighbors by class which are related with the given subject URI.
 *
 * @example
 * resourceURI = "http://kelvinlawrence.net/air-routes/resource/2018"
 * limit = 10
 *
 * SELECT ?class (COUNT(?class) AS ?count) {
 *   SELECT DISTINCT ?subject ?class {
 *     ?subject a ?class .
 *     { ?subject ?p <http://kelvinlawrence.net/air-routes/resource/2018> }
 *     UNION
 *     { <http://kelvinlawrence.net/air-routes/resource/2018> ?p ?subject }
 *   }
 *   LIMIT 10
 * }
 * GROUP BY ?class
 */
export default function neighborsCountTemplate({
  resourceURI,
  limit = 0,
}: SPARQLNeighborsCountRequest) {
  return query`
    # Count neighbors by class which are related with the given subject URI
    SELECT ?class (COUNT(?class) AS ?count) {
      ?subject a ?class {
        SELECT DISTINCT ?subject ?class {
          ?subject a ?class .
          { ?subject ?p ${idParam(resourceURI)} }
          UNION
          { ${idParam(resourceURI)} ?p ?subject }
        }
        ${limit > 0 ? `LIMIT ${limit}` : ""}
      }
    }
    GROUP BY ?class
  `;
}
