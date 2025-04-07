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
 * SELECT ?class (COUNT(?neighbor) as ?count) {
 *   SELECT DISTINCT ?class ?neighbor
 *   WHERE {
 *     BIND(<http://kelvinlawrence.net/air-routes/resource/2018> AS ?source)
 *     {
 *       # Incoming neighbors
 *       ?neighbor ?pIncoming ?source .
 *     }
 *     UNION
 *     {
 *       # Outgoing neighbors
 *       ?source ?pOutgoing ?neighbor .
 *     }
 *     ?neighbor a ?class .
 *     FILTER NOT EXISTS {
 *       ?anySubject a ?neighbor .
 *     }
 *   }
 *   LIMIT 10
 * }
 * GROUP BY ?class
 */
export default function neighborsCountTemplate({
  resourceURI,
  limit,
}: SPARQLNeighborsCountRequest) {
  const resourceTemplate = idParam(resourceURI);
  const limitTemplate = limit ? `LIMIT ${limit}` : "";

  return query`
    # Count neighbors by class which are related with the given subject URI
    SELECT ?class (COUNT(?neighbor) as ?count) {
      SELECT DISTINCT ?class ?neighbor
      WHERE {
        BIND(${resourceTemplate} AS ?source)
        {
          # Incoming neighbors
          ?neighbor ?pIncoming ?source . 
        }
        UNION
        { 
          # Outgoing neighbors
          ?source ?pOutgoing ?neighbor . 
        }

        ?neighbor a ?class .

        # Remove any classes from the list of neighbors
        FILTER NOT EXISTS {
          ?anySubject a ?neighbor .
        }
      }
      ${limitTemplate}
    }
    GROUP BY ?class
  `;
}
