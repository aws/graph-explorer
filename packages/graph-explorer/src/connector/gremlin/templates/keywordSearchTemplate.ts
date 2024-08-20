import uniq from "lodash/uniq";
import type { KeywordSearchRequest } from "@/connector/useGEFetchTypes";
import { escapeString } from "@/utils";

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
  searchById = true,
  searchByAttributes = [],
  limit = 10,
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

  if (Boolean(searchTerm) && (searchByAttributes.length !== 0 || searchById)) {
    const escapedSearchTerm = escapeString(searchTerm);

    const orContent = uniq(
      searchById && searchByAttributes.includes("__all")
        ? ["__id", ...searchByAttributes]
        : searchByAttributes
    )
      .filter(attr => attr !== "__all")
      .map(attr => {
        if (attr === "__id") {
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

  template += `.range(${offset},${offset + limit})`;
  return template;
}
