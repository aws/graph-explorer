import type { EdgeType } from "@/core";

import { DEFAULT_SAMPLE_SIZE, query } from "@/utils";

/**
 * Returns a SPARQL query to discover distinct edge connection patterns for a specific predicate.
 * Uses sampling to efficiently discover patterns in large databases.
 *
 * The query finds distinct patterns of subject class -> object class
 * by sampling triples where both subject and object have rdf:type declarations.
 */
export default function edgeConnectionsTemplate(predicate: EdgeType) {
  return query`
    SELECT DISTINCT ?sourceType ?targetType
    WHERE {
      ?s <${predicate}> ?o .
      FILTER(!isLiteral(?o))
      ?s a ?sourceType .
      ?o a ?targetType .
    }
    LIMIT ${DEFAULT_SAMPLE_SIZE}
  `;
}
