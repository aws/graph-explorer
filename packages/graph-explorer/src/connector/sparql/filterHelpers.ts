import type { QueryFragment } from "@/connector/queryFragment";
import type { VertexId } from "@/core";

import { joinFragments, LABELS, query } from "@/utils";

import { fragment } from "./fragments";
import { rdfTypeUri } from "./types";

/**
 * Generates a SPARQL FILTER clause to restrict results to specific subject classes.
 *
 * @param subjectClasses - Optional array of class URIs to filter by
 * @returns A SPARQL FILTER clause Query Fragment, or an empty fragment if no classes provided
 *
 * @example
 * // Returns: "FILTER (?class IN (<http://example.org/Person>, <http://example.org/Company>))"
 * getSubjectClasses(["http://example.org/Person", "http://example.org/Company"])
 *
 * @example
 * // Returns: ""
 * getSubjectClasses([])
 */
export function getSubjectClasses(subjectClasses?: string[]): QueryFragment {
  if (!subjectClasses?.length) {
    return query``;
  }

  if (subjectClasses.includes(LABELS.MISSING_TYPE)) {
    return query`FILTER NOT EXISTS { ?subject a ?class }`;
  }

  return query`FILTER (?class IN (${joinFragments(subjectClasses.map(fragment.iri), ", ")}))`;
}

/**
 * Generates a SPARQL FILTER clause for neighbor queries that ensures results are connections (not literals or types).
 * Filters to include only resource URIs by excluding literals and rdf:type predicates, with optional exclusion of specific resource URIs.
 *
 * @param excludedVertices - Optional set of resource URIs to exclude from results
 * @returns A SPARQL FILTER clause Query Fragment that ensures neighbors are resources and optionally excludes specific URIs
 *
 * @example
 * // With excluded vertices:
 * // Returns:
 * // "FILTER(
 * //   !isLiteral(?neighbor) &&
 * //   ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> &&
 * //   ?neighbor NOT IN (
 * //     <http://example.org/vertex1>,
 * //     <http://example.org/vertex2>
 * //   )
 * // )"
 * getNeighborsFilter(new Set(["http://example.org/vertex1", "http://example.org/vertex2"]))
 *
 * @example
 * // Without excluded vertices:
 * // Returns: "FILTER(!isLiteral(?neighbor) && ?predicate != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)"
 * getNeighborsFilter()
 */
export function getNeighborsFilter(
  excludedVertices?: Set<VertexId>,
): QueryFragment {
  const excludedVerticesTemplates = Array.from(excludedVertices ?? []).map(
    fragment.iri,
  );

  return excludedVerticesTemplates.length > 0
    ? query`
        FILTER(
          !isLiteral(?neighbor) &&
          ?predicate != ${fragment.iri(rdfTypeUri)} &&
          ?neighbor NOT IN (
            ${joinFragments(excludedVerticesTemplates, ",\n")}
          )
        )
      `
    : query`FILTER(!isLiteral(?neighbor) && ?predicate != ${fragment.iri(rdfTypeUri)})`;
}

/**
 * Generates a SPARQL LIMIT and OFFSET clause for pagination.
 *
 * @param limit - Optional maximum number of results to return
 * @param offset - Optional number of results to skip
 * @returns A SPARQL clause Query Fragment with LIMIT and/or OFFSET, or an empty fragment if neither provided
 *
 * @example
 * // Returns: "LIMIT 10 OFFSET 20"
 * getLimit(10, 20)
 *
 * @example
 * // Returns: "LIMIT 50"
 * getLimit(50)
 *
 * @example
 * // Returns: "OFFSET 100"
 * getLimit(undefined, 100)
 *
 * @example
 * // Returns: ""
 * getLimit()
 */
export function getLimit(limit?: number, offset?: number): QueryFragment {
  return joinFragments(
    [
      limit ? query`LIMIT ${fragment.number(limit)}` : query``,
      offset ? query`OFFSET ${fragment.number(offset)}` : query``,
    ].filter(Boolean),
    " ",
  );
}
