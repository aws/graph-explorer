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
const fuzzySearchTemplate = ({
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
          return `has(id,containing("${searchTerm}")`
          //return `has(id,containing("${searchTerm}"), has(id,containg("${searchTerm?.toUpperCase()}")), has(id,containg("${searchTerm?.toLowerCase()}")))`;
        }
        if (exactMatch === true) {
          return `has("${attr}","${searchTerm}")`;
        }
        return `filter{it.get().property("${attr}").value().contains("${searchTerm?.toUpperCase()}")}`
        //return `has("${attr}",containing("${searchTerm}")), has(id,containg("${searchTerm?.toUpperCase()}")), has(id,containg("${searchTerm?.toLowerCase()}"))`;
        
      })
      .join(",");

    template += `.${orContent}`;
    //template += `filter{it.get().has("${attr}","${searchTerm}")}`
  }

  //template += `.range(${offset},${offset + limit})`;
  console.log(`Search Q: ${template}`)
  return template;
};

export default fuzzySearchTemplate;
