import { escapeString, query, SEARCH_TOKENS } from "@/utils";
import { rdfTypeUri, type SPARQLKeywordSearchRequest } from "../types";
import { idParam } from "../idParam";
import { getLimit, getSubjectClasses } from "../filterHelpers";

/**
 * Fetch nodes matching the given search parameters
 * @example
 * searchTerm = "Ch"
 * subjectClasses = ["http://www.example.com/soccer/ontology/Team"]
 * predicates = [
 *   "http://www.example.com/soccer/ontology/teamName",
 *   "http://www.example.com/soccer/ontology/nickname"
 * ]
 * limit = 10
 * offset = 0
 *
 * # Fetch nodes matching the given search parameters
 * SELECT DISTINCT ?subject ?predicate ?object
 * WHERE {
 *   {
 *     # This sub-query will find any matching instances to the given filters and limit the results
 *     SELECT DISTINCT ?subject
 *     WHERE {
 *       ?subject ?pValue ?value .
 *       OPTIONAL { ?subject a ?class } .
 *       FILTER (?pValue IN (
 *         <http://www.example.com/soccer/ontology/teamName>,
 *         <http://www.example.com/soccer/ontology/nickname>
 *       ))
 *       FILTER (?class IN (
 *         <http://www.example.com/soccer/ontology/Team>
 *       ))
 *       FILTER (regex(str(?value), "Ch", "i"))
 *     }
 *     LIMIT 10
 *     OFFSET 0
 *   }
 *   {
 *     # Values and types
 *     ?subject ?predicate ?object
 *     FILTER(isLiteral(?object) || ?predicate = <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>)
 *   }
 * }
 */
export default function keywordSearchTemplate(
  request: SPARQLKeywordSearchRequest,
): string {
  return query`
    # Fetch nodes matching the given search parameters
    SELECT DISTINCT ?subject ?predicate ?object
    WHERE {
      {
        # This sub-query will find any matching instances to the given filters and limit the results
        ${findSubjectsMatchingFilters(request)}
      }
      {
        # Values and types
        ?subject ?predicate ?object
        FILTER(isLiteral(?object) || ?predicate = ${idParam(rdfTypeUri)})
      }
    }
  `;
}

/**
 * Generates a SPARQL sub-query to find subjects matching the given search filters.
 * This sub-query is used within keyword search and blank node neighbor fetching to identify matching resources before fetching their full details.
 *
 * @param request - Search parameters including search term, predicates, subject classes, and pagination
 * @returns A SPARQL SELECT query that returns distinct subjects matching the filters
 *
 * @example
 * // With all filters:
 * // Returns:
 * // "SELECT DISTINCT ?subject
 * // WHERE {
 * //   ?subject ?pValue ?value .
 * //   OPTIONAL { ?subject a ?class } .
 * //   FILTER (?pValue IN (<http://example.org/name>, <http://example.org/title>))
 * //   FILTER (?class IN (<http://example.org/Person>))
 * //   FILTER (regex(str(?value), "John", "i"))
 * // }
 * // LIMIT 10 OFFSET 0"
 * findSubjectsMatchingFilters({
 *   searchTerm: "John",
 *   predicates: ["http://example.org/name", "http://example.org/title"],
 *   subjectClasses: ["http://example.org/Person"],
 *   limit: 10,
 *   offset: 0
 * })
 *
 * @example
 * // With exact match:
 * // Returns query with: FILTER (?value = "John")
 * findSubjectsMatchingFilters({
 *   searchTerm: "John",
 *   exactMatch: true
 * })
 */
export function findSubjectsMatchingFilters(
  request: SPARQLKeywordSearchRequest,
) {
  return query`
    SELECT DISTINCT ?subject
    WHERE {
      ?subject ?pValue ?value .
      OPTIONAL { ?subject a ?class } .
      ${getFilterPredicates(request.predicates)}
      ${getSubjectClasses(request.subjectClasses)}
      ${getFilterObject(request.exactMatch, request.searchTerm)}
    }
    ${getLimit(request.limit, request.offset)}
  `;
}

function getFilterPredicates(predicates?: string[]) {
  const filteredPredicates =
    predicates?.filter(p => p !== SEARCH_TOKENS.ALL_ATTRIBUTES) || [];
  if (!filteredPredicates.length) {
    return "";
  }

  return `FILTER (?pValue IN (${filteredPredicates.map(idParam).join(", ")}))`;
}

function getFilterObject(exactMatch?: boolean, searchTerm?: string) {
  if (!searchTerm) {
    return "";
  }

  const escapedSearchTerm = escapeString(searchTerm);

  return exactMatch === true
    ? `FILTER (?value = "${escapedSearchTerm}")`
    : `FILTER (regex(str(?value), "${escapedSearchTerm}", "i"))`;
}
