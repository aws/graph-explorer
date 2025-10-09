import { query } from "@/utils";
import { rdfTypeUri, SPARQLKeywordSearchRequest } from "../types";
import {
  getFilterObject,
  getFilterPredicates,
  getSubjectClasses,
} from "./helpers";
import { getLimit } from "../getLimit";
import { idParam } from "../idParam";

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
 *       ?subject a       ?class ;
 *                ?pValue ?value .
 *       FILTER (?pValue IN (
 *           <http://www.example.com/soccer/ontology/teamName>,
 *           <http://www.example.com/soccer/ontology/nickname>
 *       ))
 *       FILTER (?class IN (
 *           <http://www.example.com/soccer/ontology/Team>
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
export default function keywordSearchTemplate({
  searchTerm,
  subjectClasses = [],
  predicates = [],
  limit,
  offset = 0,
  exactMatch = false,
}: SPARQLKeywordSearchRequest): string {
  return query`
    # Fetch nodes matching the given search parameters
    SELECT DISTINCT ?subject ?predicate ?object
    WHERE {
      {
        # This sub-query will find any matching instances to the given filters and limit the results
        SELECT DISTINCT ?subject
        WHERE {
          ?subject a       ?class ;
                   ?pValue ?value .
          ${getFilterPredicates(predicates)}
          ${getSubjectClasses(subjectClasses)}
          ${getFilterObject(exactMatch, searchTerm)}
        }
        ${getLimit(limit, offset)}
      }
      {
        # Values and types
        ?subject ?predicate ?object
        FILTER(isLiteral(?object) || ?predicate = ${idParam(rdfTypeUri)})
      }
    }
  `;
}
