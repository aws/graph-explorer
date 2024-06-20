import { SPARQLKeywordSearchRequest } from "../../types";
import {
  getFilterObject,
  getFilterPredicates,
  getSubjectClasses,
} from "./helpers";

/**
 * This generates a template to get all blank nodes ids from
 * a generic keyword search request.
 *
 * @see keywordSearchTemplate
 */
export default function keywordSearchBlankNodesIdsTemplate({
  searchTerm,
  subjectClasses = [],
  predicates = [],
  limit = 10,
  offset = 0,
  exactMatch = true,
}: SPARQLKeywordSearchRequest): string {
  return `
    SELECT DISTINCT ?bNode {
      ?bNode ?pred ?value {
        SELECT DISTINCT ?bNode {
            ?bNode a          ?class ;
                   ?predicate ?value .
            ${getFilterPredicates(predicates)}
            ${getSubjectClasses(subjectClasses)}
            ${getFilterObject(exactMatch, searchTerm)}
        }
        ${limit > 0 ? `LIMIT ${limit} OFFSET ${offset}` : ""}
      }
      FILTER(isLiteral(?value))
      FILTER(isBlank(?bNode))
    }
  `;
}
