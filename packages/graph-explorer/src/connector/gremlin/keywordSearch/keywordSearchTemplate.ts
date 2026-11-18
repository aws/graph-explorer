import uniq from "lodash/uniq";

import type { KeywordSearchRequest } from "@/connector";
import type { QueryFragment } from "@/connector/queryFragment";

import { joinFragments, query, SEARCH_TOKENS } from "@/utils";

import { fragment } from "../fragments";

function searchConditions(
  searchTerm: string,
  searchByAttributes: string[],
  exactMatch: boolean,
): QueryFragment {
  const searchLiteral = fragment.string(searchTerm);

  return joinFragments(
    uniq(searchByAttributes).map(attr => {
      if (attr === SEARCH_TOKENS.NODE_ID) {
        if (exactMatch === true) {
          return query`has(id,${searchLiteral})`;
        }
        return query`has(id,containing(${searchLiteral}))`;
      }
      const key = fragment.identifier(attr);
      if (exactMatch === true) {
        return query`has(${key},${searchLiteral})`;
      }
      return query`has(${key},containing(${searchLiteral}))`;
    }),
    ",",
  );
}

/**
 * @example
 * searchTerm = "JFK"
 * vertexTypes = ["airport"]
 * searchByAttributes = ["city", "code"]
 * limit = 100
 * offset = 0
 * exactMatch = false
 *
 * g.V()
 *  .hasLabel('airport')
 *  .or(
 *    has('city',containing('JFK')),
 *    has('code',containing('JFK'))
 *  )
 *  .range(0,100)
 */
export default function keywordSearchTemplate({
  searchTerm,
  vertexTypes = [],
  searchByAttributes = [],
  limit,
  offset = 0,
  exactMatch = false,
}: KeywordSearchRequest): QueryFragment {
  const hasLabelTemplate =
    vertexTypes.length !== 0
      ? query`.hasLabel(${joinFragments(vertexTypes.map(fragment.identifier), ",")})`
      : query``;
  const orTemplate = searchTerm
    ? query`.or(${searchConditions(searchTerm, searchByAttributes, exactMatch)})`
    : query``;
  const rangeTemplate = limit
    ? query`.range(${fragment.number(offset)},${fragment.number(offset + limit)})`
    : query``;

  return query`g.V()${hasLabelTemplate}${orTemplate}${rangeTemplate}`;
}
