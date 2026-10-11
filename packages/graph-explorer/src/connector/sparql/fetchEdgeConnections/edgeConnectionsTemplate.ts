import type { EdgeType } from "@/core";

import { DEFAULT_SAMPLE_SIZE, query } from "@/utils";

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
}) {
  // Plain-string arms joined with a bare UNION, normalized once by the outer
  // `query` tag. Nesting `query` inside `query` double-normalizes and leaves the
  // output raggedly indented (cosmetic, but confusing when debugging).
  const arms = predicates
    .map(predicate => {
      const iri = fragment.iri(predicate);
      return `{
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
      LIMIT ${DEFAULT_SAMPLE_SIZE}
    }
  }
}`;
    })
    .join("\nUNION\n");

  return query`
    SELECT DISTINCT ?edgeType ?sourceType ?targetType
    WHERE {
      ${arms}
    }
  `;
}
