import type { VertexId } from "@/core";

import { LABELS, query } from "@/utils";

import { idParam } from "./idParam";
import { rdfTypeUri } from "./types";

/**
 * Generates a SPARQL FILTER clause to restrict results to specific subject classes.
 *
 * @param subjectClasses - Optional array of class URIs to filter by
 * @returns A SPARQL FILTER clause string, or empty string if no classes provided
 *
 * @example
 * // Returns: "FILTER (?class IN (<http://example.org/Person>, <http://example.org/Company>))"
 * getSubjectClasses(["http://example.org/Person", "http://example.org/Company"])
 *
 * @example
 * // Returns: ""
 * getSubjectClasses([])
 */
export function getSubjectClasses(subjectClasses?: string[]) {
  if (!subjectClasses?.length) {
    return "";
  }

  if (subjectClasses.includes(LABELS.MISSING_TYPE)) {
    return "FILTER NOT EXISTS { ?subject a ?class }";
  }

  return `FILTER (?class IN (${subjectClasses.map(idParam).join(", ")}))`;
}

/**
 * Generates a SPARQL FILTER clause for neighbor queries that ensures results are connections (not literals or types).
 * Filters to include only resource URIs by excluding literals and rdf:type predicates, with optional exclusion of specific resource URIs.
 *
 * @param excludedVertices - Optional set of resource URIs to exclude from results
 * @returns A SPARQL FILTER clause string that ensures neighbors are resources and optionally excludes specific URIs
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
export function getNeighborsFilter(excludedVertices?: Set<VertexId>) {
  const excludedVerticesTemplates = (excludedVertices || new Set<VertexId>())
    .values()
    .map(idParam)
    .toArray();

  return excludedVerticesTemplates.length > 0
    ? query`
        FILTER(
          !isLiteral(?neighbor) &&
          ?predicate != ${idParam(rdfTypeUri)} &&
          ?neighbor NOT IN (
            ${excludedVerticesTemplates.join(", \n")}
          )
        )
      `
    : `FILTER(!isLiteral(?neighbor) && ?predicate != ${idParam(rdfTypeUri)})`;
}

/**
 * Generates a SPARQL LIMIT and OFFSET clause for pagination.
 *
 * @param limit - Optional maximum number of results to return
 * @param offset - Optional number of results to skip
 * @returns A SPARQL clause string with LIMIT and/or OFFSET, or empty string if neither provided
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
export function getLimit(limit?: number, offset?: number) {
  const limitTemplate = limit ? `LIMIT ${limit}` : null;
  const offsetTemplate = offset ? `OFFSET ${offset}` : null;

  // Combine the parts that exist with a space
  return [limitTemplate, offsetTemplate].filter(Boolean).join(" ");
}
