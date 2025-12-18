import { query } from "@/utils";

/**
 * Fetch all distinct edge connections between resource types.
 * Returns source type, predicate, target type, and count for each combination.
 *
 * Note: SPARQL resources can have multiple rdf:type triples, so each
 * source-predicate-target type combination becomes a separate edge connection.
 */
export default function edgeConnectionsTemplate() {
  return query`
    # Fetch all distinct edge connections between resource types
    SELECT ?sourceType ?predicate ?targetType (COUNT(*) AS ?count)
    WHERE {
      ?source a ?sourceType .
      ?source ?predicate ?target .
      ?target a ?targetType .
      FILTER(?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
    }
    GROUP BY ?sourceType ?predicate ?targetType
  `;
}
