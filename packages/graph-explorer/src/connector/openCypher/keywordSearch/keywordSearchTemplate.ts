import uniq from "lodash/uniq";

import type { QueryFragment } from "@/connector/queryFragment";
import type { KeywordSearchRequest } from "@/connector/useGEFetchTypes";

import { joinFragments, LABELS, query, SEARCH_TOKENS } from "@/utils";

import { fragment } from "../fragments";

/**
 * @example
 * searchTerm = "JFK"
 * vertexTypes = ["airport"]
 * searchByAttributes = ["city", "code"]
 * limit = 100
 * offset = 0
 * exactMatch = false
 *
 * MATCH (v:airport)
 * WHERE (v.city CONTAINS "JFK" OR v.code CONTAINS "JFK")
 * RETURN v as object
 * ORDER BY id(v)
 * LIMIT 100
 */
function keywordSearchTemplate({
  searchTerm,
  vertexTypes = [],
  searchByAttributes = [],
  limit,
  offset,
  exactMatch,
}: KeywordSearchRequest): QueryFragment {
  // Check if we're searching for nodes with no type by checking that the MISSING_TYPE is the only type defined
  const isMissingTypeSearch =
    vertexTypes.length > 0 &&
    vertexTypes.every(item => item === LABELS.MISSING_TYPE);

  // For exactly one vertex type we put the type in the match (unless it's MISSING_TYPE)
  const vertexMatchTemplate =
    vertexTypes.length === 1 && !isMissingTypeSearch
      ? query`v:${fragment.identifier(vertexTypes[0])}`
      : query`v`;

  // For multiple vertex types we use the where clause
  const vertexTypeWhereClause = isMissingTypeSearch
    ? query`labels(v) = []`
    : vertexTypes.length > 1
      ? joinFragments(
          vertexTypes.map(type => query`v:${fragment.identifier(type)}`),
          " OR ",
        )
      : query``;

  // If we have a search term we need to build the search term where clause.
  // The truthiness check narrows searchTerm to a string for the literal.
  const searchLiteral = searchTerm ? fragment.string(searchTerm) : undefined;
  const searchTermWhereClause =
    searchLiteral === undefined
      ? query``
      : joinFragments(
          uniq(searchByAttributes).map(attr => {
            // ID is a special case
            if (attr === SEARCH_TOKENS.NODE_ID) {
              return exactMatch === true
                ? query`id(v) = ${searchLiteral}`
                : query`toString(id(v)) CONTAINS ${searchLiteral}`;
            }

            return exactMatch === true
              ? query`v.${fragment.identifier(attr)} = ${searchLiteral}`
              : query`v.${fragment.identifier(attr)} CONTAINS ${searchLiteral}`;
          }),
          " OR ",
        );

  // Combine the where clauses together (i.e. WHERE clause1 AND clause2)
  const whereClauses = [vertexTypeWhereClause, searchTermWhereClause]
    .filter(Boolean)
    .map(clause => query`(${clause})`);
  // `query` indents the lines after the first to the column after `WHERE `
  const whereTemplate =
    whereClauses.length > 0
      ? query`WHERE ${joinFragments(whereClauses, "\nAND ")}`
      : query``;

  // Add paging options if needed
  const limitTemplate =
    limit && offset
      ? query`SKIP ${fragment.number(offset)} LIMIT ${fragment.number(limit)}`
      : limit
        ? query`LIMIT ${fragment.number(limit)}`
        : query``;

  return query`
    MATCH (${vertexMatchTemplate})
    ${whereTemplate}
    RETURN v AS object
    ${limitTemplate}
  `;
}

export default keywordSearchTemplate;
