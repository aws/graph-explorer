import { type SPARQLKeywordSearchRequest } from "../types";
import { getLimit } from "../getLimit";
import {
  getFilterObject,
  getFilterPredicates,
  getSubjectClasses,
} from "./helpers";
import { query } from "@/utils";

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
 * SELECT ?subject ?pred ?value ?class {
 *   ?subject ?pred ?value {
 *     SELECT DISTINCT ?subject ?class {
 *         ?subject a          ?class ;
 *                  ?predicate ?value .
 *         FILTER (?predicate IN (
 *             <http://www.example.com/soccer/ontology/teamName>,
 *             <http://www.example.com/soccer/ontology/nickname>
 *         ))
 *         FILTER (?class IN (
 *             <http://www.example.com/soccer/ontology/Team>
 *         ))
 *         FILTER (regex(str(?value), "Ch", "i"))
 *     }
 *     LIMIT 10
 *     OFFSET 0
 *   }
 *   FILTER(isLiteral(?value))
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
    SELECT ?subject ?pred ?value ?class {
      ?subject ?pred ?value {
        SELECT DISTINCT ?subject ?class {
            ?subject a          ?class ;
                     ?predicate ?value .
            ${getFilterPredicates(predicates)}
            ${getSubjectClasses(subjectClasses)}
            ${getFilterObject(exactMatch, searchTerm)}
        }
        ${getLimit(limit, offset)}
      }
      FILTER(isLiteral(?value))
    }
  `;
}
