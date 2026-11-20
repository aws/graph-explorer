import type { QueryFragment } from "@/connector/queryFragment";
import type { VertexType } from "@/core";

import { joinFragments, query } from "@/utils";

import { fragment } from "../fragments";

/**
 * Returns a SPARQL query that discovers the literal-valued predicates for a
 * batch of classes in a single request.
 *
 * Each class contributes one `UNION` arm that samples a single instance of the
 * class (`LIMIT 1` subject) and returns that instance's literal predicates with
 * a sample object for datatype inference, tagged with the class IRI projected as
 * `?class` so the caller can regroup the rows by class. Keeping the inner
 * `LIMIT 1` subject correlated with the predicate scan inside each arm bounds
 * the sample per class — a global `VALUES ?class` shape de-correlates the scan
 * and scans every instance of every class instead.
 */
export default function predicatesByClassTemplate({
  classes,
}: {
  classes: VertexType[];
}): QueryFragment {
  const arms = classes.map(resourceClass => {
    const iri = fragment.iri(resourceClass);
    return query`
      {
        SELECT (${iri} AS ?class) ?pred ?object
        WHERE {
          {
            SELECT ?subject
            WHERE {
              ?subject a ${iri}.
            }
            LIMIT 1
          }
          ?subject ?pred ?object.
          FILTER(!isBlank(?object) && isLiteral(?object))
        }
      }
    `;
  });

  return query`
    # Return all predicates which are connected from the given class
    SELECT ?class ?pred (SAMPLE(?object) as ?sample)
    WHERE {
      ${joinFragments(arms, "\nUNION\n")}
    }
    GROUP BY ?class ?pred
  `;
}
