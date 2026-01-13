import { query } from "@/utils";

import type { SPARQLKeywordSearchRequest } from "../types";

import { findSubjectsMatchingFilters } from "./keywordSearchTemplate";

/**
 * This generates a template to get all blank nodes ids from
 * a generic keyword search request.
 *
 * @see keywordSearchTemplate
 */
export default function keywordSearchBlankNodesIdsTemplate(
  request: SPARQLKeywordSearchRequest,
) {
  return query`
    # Fetch all blank nodes ids from a generic keyword search request
    SELECT DISTINCT (?subject as ?bNode)
    WHERE {
      {
        # This sub-query will find any matching instances to the given filters and limit the results
        ${findSubjectsMatchingFilters(request)}
      }
      FILTER(isBlank(?subject))
    }
  `;
}
