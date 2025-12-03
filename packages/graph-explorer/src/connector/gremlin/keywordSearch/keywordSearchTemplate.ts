import uniq from "lodash/uniq";
import type { KeywordSearchRequest } from "@/connector";
import { escapeString, SEARCH_TOKENS } from "@/utils";

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
 *  .hasLabel("airport")
 *  .or(
 *    has("city", containing("JFK"),
 *    has("code", containing("JFK")
 *  )
 *  .range(0, 100)
 */
export default function keywordSearchTemplate({
  searchTerm,
  vertexTypes = [],
  searchByAttributes = [],
  limit,
  offset = 0,
  exactMatch = false,
}: KeywordSearchRequest): string {
  let template = "g.V()";

  if (vertexTypes.length !== 0) {
    const hasLabelContent = vertexTypes
      .flatMap(type => type.split("::"))
      .map(type => `"${type}"`)
      .join(",");
    template += `.hasLabel(${hasLabelContent})`;
  }

  if (searchTerm) {
    const escapedSearchTerm = escapeString(searchTerm);

    const orContent = uniq(
      searchByAttributes.includes(SEARCH_TOKENS.ALL_ATTRIBUTES)
        ? [SEARCH_TOKENS.NODE_ID, ...searchByAttributes]
        : searchByAttributes,
    )
      .filter(attr => attr !== SEARCH_TOKENS.ALL_ATTRIBUTES)
      .map(attr => {
        if (attr === SEARCH_TOKENS.NODE_ID) {
          if (exactMatch === true) {
            return `has(id,"${escapedSearchTerm}")`;
          }
          return `has(id,containing("${escapedSearchTerm}"))`;
        }
        if (exactMatch === true) {
          return `has("${attr}","${escapedSearchTerm}")`;
        }
        return `has("${attr}",containing("${escapedSearchTerm}"))`;
      })
      .join(",");

    template += `.or(${orContent})`;
  }

  if (limit) {
    template += `.range(${offset},${offset + limit})`;
  }
  return template;
}
