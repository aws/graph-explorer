import { query } from "@/utils";
import { SPARQLKeywordSearchRequest } from "../types";
import {
  getFilterObject,
  getFilterPredicates,
  getSubjectClasses,
} from "./helpers";
import { getLimit } from "../getLimit";

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
  limit,
  offset = 0,
  exactMatch = true,
}: SPARQLKeywordSearchRequest): string {
  return query`
    # Fetch all blank nodes ids from a generic keyword search request
    SELECT DISTINCT ?bNode
    WHERE {
      {
        # This sub-query will find any matching instances to the given filters and limit the results
        SELECT DISTINCT ?bNode
        WHERE {
          ?bNode a       ?class ;
                 ?pValue ?value .
          ${getFilterPredicates(predicates)}
          ${getSubjectClasses(subjectClasses)}
          ${getFilterObject(exactMatch, searchTerm)}
        }
        ${getLimit(limit, offset)}
      }
      FILTER(isBlank(?bNode))
    }
  `;
}
