import uniq from "lodash/uniq";

import type { KeywordSearchRequest } from "@/connector/useGEFetchTypes";

import { LABELS, query, SEARCH_TOKENS } from "@/utils";

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
const keywordSearchTemplate = ({
  searchTerm,
  vertexTypes = [],
  searchByAttributes = [],
  limit,
  offset,
  exactMatch,
}: KeywordSearchRequest): string => {
  // Check if we're searching for nodes with no type by checking that the MISSING_TYPE is the only type defined
  const isMissingTypeSearch =
    vertexTypes.length > 0 &&
    vertexTypes.every(item => item === LABELS.MISSING_TYPE);

  // For exactly one vertex type we put the type in the match (unless it's MISSING_TYPE)
  const vertexMatchTemplate =
    vertexTypes.length === 1 && !isMissingTypeSearch
      ? `v:${fragment.identifier(vertexTypes[0])}`
      : "v";

  // For multiple vertex types we use the where clause
  const vertexTypeWhereClause = isMissingTypeSearch
    ? "labels(v) = []"
    : vertexTypes.length > 1 &&
      vertexTypes.map(type => `v:${fragment.identifier(type)}`).join(" OR ");

  // If we have a search term we need to build the search term where clause.
  // The truthiness check narrows searchTerm to a string for the literal.
  const searchLiteral = searchTerm ? fragment.string(searchTerm) : undefined;
  const searchTermWhereClause =
    searchLiteral !== undefined &&
    uniq(searchByAttributes)
      .map(attr => {
        // ID is a special case
        if (attr === SEARCH_TOKENS.NODE_ID) {
          return exactMatch === true
            ? `id(v) = ${searchLiteral}`
            : `toString(id(v)) CONTAINS ${searchLiteral}`;
        }

        return exactMatch === true
          ? `v.${attr} = ${searchLiteral}`
          : `v.${attr} CONTAINS ${searchLiteral}`;
      })
      .join(" OR ");

  // Combine the where clauses together (i.e. WHERE clause1 AND clause2)
  const whereClauses = [vertexTypeWhereClause, searchTermWhereClause]
    .filter(Boolean)
    .filter(w => w != null)
    .map(clause => `(${clause})`)
    .join("\n      AND ");
  const whereTemplate = whereClauses ? `WHERE ${whereClauses}` : "";

  // Add paging options if needed
  const limitTemplate =
    limit && offset
      ? `SKIP ${offset} LIMIT ${limit}`
      : limit
        ? `LIMIT ${limit}`
        : "";

  return query`
    MATCH (${vertexMatchTemplate})
    ${whereTemplate}
    RETURN v AS object
    ${limitTemplate}
  `;
};

export default keywordSearchTemplate;
