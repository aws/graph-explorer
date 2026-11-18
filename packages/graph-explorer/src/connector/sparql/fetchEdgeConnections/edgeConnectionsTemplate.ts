import type { QueryFragment } from "@/connector/queryFragment";
import type { EdgeType } from "@/core";

import { DEFAULT_SAMPLE_SIZE, joinFragments, query } from "@/utils";

import { fragment } from "../fragments";

/**
 * Returns a SPARQL query that discovers distinct edge connection patterns for a
 * batch of predicates in a single request.
 *
 * Each predicate contributes one `UNION` arm that samples its triples and
 * returns the distinct subject-class/object-class pairs, tagged with the
 * predicate IRI projected as `?edgeType` so the caller can regroup the rows by
 * predicate. Each arm keeps its own inner `LIMIT` so the sample stays bounded
 * per predicate — a high-volume predicate cannot starve a low-volume one, and
 * intermediate results stay bounded by the chunk size rather than the graph.
 */
export default function edgeConnectionsTemplate({
  predicates,
}: {
  predicates: EdgeType[];
}): QueryFragment {
  const limit = fragment.number(DEFAULT_SAMPLE_SIZE);

  const arms = predicates.map(predicate => {
    const iri = fragment.iri(predicate);
    return query`
      {
        SELECT (${iri} AS ?edgeType) ?sourceType ?targetType
        WHERE {
          {
            SELECT ?sourceType ?targetType
            WHERE {
              ?s ${iri} ?o .
              FILTER(!isLiteral(?o))
              ?s a ?sourceType .
              ?o a ?targetType .
            }
            LIMIT ${limit}
          }
        }
      }
    `;
  });

  return query`
    SELECT DISTINCT ?edgeType ?sourceType ?targetType
    WHERE {
      ${joinFragments(arms, "\nUNION\n")}
    }
  `;
}
