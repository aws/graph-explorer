import uniq from "lodash/uniq";
import type { KeywordSearchRequest } from "@/connector/useGEFetchTypes";
import { escapeString } from "@/utils";

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
      searchByAttributes.includes("__all")
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

  if (limit) {
    template += `.range(${offset},${offset + limit})`;
  }
  return template;
}
