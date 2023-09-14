import uniq from "lodash/uniq";
import type { KeywordSearchRequest } from "../../AbstractConnector";

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
const keywordSearchTemplate = ({
  searchTerm,
  vertexTypes = [],
  searchById = true,
  searchByAttributes = [],
  limit = 10,
  offset = 0,
  exactMatch = false,
}: KeywordSearchRequest): string => {
  let template = "g.V()";

  if (vertexTypes.length !== 0) {
    const hasLabelContent = vertexTypes
      .flatMap(type => type.split("::"))
      .map(type => `"${type}"`)
      .join(",");
    template += `.hasLabel(${hasLabelContent})`;
  }

  if (Boolean(searchTerm) && (searchByAttributes.length !== 0 || searchById)) {
    const orContent = uniq(
        (searchById && searchByAttributes.includes("__all")) ? ["_id", ...searchByAttributes] : searchByAttributes
    )
      .filter(attr => attr !== "__all")
      .map(attr => {
        if (attr === "_id") {
          if (exactMatch === true) {
             return `has(id,"${searchTerm}")`;
          }
          return `has(id,containing("${searchTerm}"))`;
        }
        if (exactMatch === true) {
          return `has("${attr}","${searchTerm}")`;
        }
        return `has("${attr}",containing("${searchTerm}"))`;
      })
      .join(",");

    template += `.or(${orContent})`;
  }

  template += `.range(${offset},${offset + limit})`;
  return template;
};

export default keywordSearchTemplate;
