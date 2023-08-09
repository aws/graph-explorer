import uniq from "lodash/uniq";
import type { KeywordSearchRequest } from "../../AbstractConnector";

/**
 * @example
 * searchTerm = "JFK"
 * vertexTypes = ["airport"]
 * searchByAttributes = ["city", "code"]
 * limit = 100
 * offset = 0
 *
 * MATCH (v:airport)
 * WHERE
 *   v.city CONTAINS "JFK" OR
 *   v.code CONTAINS "JFK"
 * RETURN v
 * SKIP 0
 * LIMIT 100
 */
const keywordSearchTemplate = ({
  searchTerm,
  vertexTypes = [],
  searchById = true,
  searchByAttributes = [],
  limit = 10,
  offset = 0,
}: KeywordSearchRequest): string => {
  let template = "";

  if (vertexTypes.length === 1) {
    const label = vertexTypes[0];

    template += `MATCH (v:\`${label}\`)`;
  } 

  if (Boolean(searchTerm) && (searchByAttributes.length !== 0 || searchById)) {
    const orContent = uniq(
      searchById ? ["id", ...searchByAttributes] : searchByAttributes
    )
      .map((attr: any) => {
        if (attr === "id") {
          return `v.\`~id\` CONTAINS "${searchTerm}" `;
        }
        return `v.${attr} CONTAINS "${searchTerm}" `;
      })
      .join(` OR `);

    template += ` WHERE ${orContent} `;
  }

  template += ` RETURN v AS object SKIP ${offset} LIMIT ${limit}`;
  return template;
};

export default keywordSearchTemplate;
