import uniq from "lodash/uniq";
import type { KeywordSearchRequest } from "../../useGEFetchTypes";
import { escapeString } from "../../../utils";
import dedent from "dedent";

/**
 * @example
 * searchTerm = "JFK"
 * vertexTypes = ["airport"]
 * searchById = false
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
  searchById,
  searchByAttributes = [],
  limit,
  offset,
  exactMatch,
}: KeywordSearchRequest): string => {
  // For exactly one vertex type we put the type in the match
  const vertexMatchTemplate =
    vertexTypes.length === 1 ? `v:\`${vertexTypes[0]}\`` : "v";
  // For multiple vertex types we use the where clause
  const vertexTypeWhereClause =
    vertexTypes.length > 1 &&
    vertexTypes.map(type => `v:\`${type}\``).join(" OR ");

  // If we have a search term we need to build the search term where clause
  const hasSearchTerm =
    Boolean(searchTerm) && (searchByAttributes.length !== 0 || searchById);
  const searchTermWhereClause =
    hasSearchTerm &&
    uniq(
      searchById && searchByAttributes.includes("__all")
        ? ["__id", ...searchByAttributes]
        : searchByAttributes
    )
      .filter(attr => attr !== "__all")
      .map(attr => {
        // ID is a special case
        if (attr === "__id") {
          return exactMatch === true
            ? `id(v) = "${escapeString(searchTerm)}"`
            : `toString(id(v)) CONTAINS "${escapeString(searchTerm)}"`;
        }

        return exactMatch === true
          ? `v.${attr} = "${escapeString(searchTerm)}"`
          : `v.${attr} CONTAINS "${escapeString(searchTerm)}"`;
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

  return dedent`
    MATCH (${vertexMatchTemplate})
    ${whereTemplate}
    RETURN v AS object
    ${limitTemplate}
  `;
};

export default keywordSearchTemplate;
