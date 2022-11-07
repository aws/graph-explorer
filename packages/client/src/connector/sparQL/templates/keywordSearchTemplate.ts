import type { KeywordSearchRequest } from "../../AbstractConnector";

/**
 * @example
 * searchTerm = "Ch"
 * vertexTypes = ["http://www.example.com/soccer/ontology/Team"]
 * searchByAttributes = [
 *   "http://www.example.com/soccer/ontology/teamName",
 *   "http://www.example.com/soccer/ontology/nickname"
 * ]
 * limit = 10
 * offset = 0
 *
 * SELECT DISTINCT ?start ?vertexType ?property ?propertyValue
 * {
 *   ?start ?property ?propertyValue
 *   {
 *     SELECT DISTINCT ?start ?vertexType
 *     {
 *       ?start ?property ?propertyValue
 *       {
 *         SELECT *
 *         {
 *           ?start ?edgeType ?vertexType
 *           FILTER(?vertexType = <http://www.example.com/soccer/ontology/Team>)
 *         }
 *       }
 *       FILTER (
 *         (?property = <http://www.example.com/soccer/ontology/teamName> && regex(str(?propertyValue), "Ch", "i")) ||
 *         (?property = <http://www.example.com/soccer/ontology/nickname> && regex(str(?propertyValue), "Ch", "i"))
 *       )
 *     }
 *     LIMIT 10
 *     OFFSET 0
 *   }
 * }
 */
const keywordSearchTemplate = ({
  searchTerm,
  vertexTypes = [],
  searchByAttributes = [],
  limit = 10,
  offset = 0,
}: KeywordSearchRequest): string => {
  let template =
    "SELECT DISTINCT ?start ?vertexType ?property ?propertyValue {";
  template += "?start ?property ?propertyValue { ";
  template += "SELECT DISTINCT ?start ?vertexType { ";
  template += "?start ?property ?propertyValue { ";
  template += "SELECT * { ?start ?edgeType ?vertexType ";

  if (vertexTypes.length !== 0) {
    template += "FILTER(";

    vertexTypes?.forEach((vt, vtIndex) => {
      template += `?vertexType = <${vt}>`;

      if (vtIndex < vertexTypes?.length - 1) {
        template += " || ";
      }
    });

    template += ")";
  }

  template += "}}";

  if (Boolean(searchTerm) && searchByAttributes.length !== 0) {
    template += "FILTER (";

    searchByAttributes?.forEach((attr, attrIndex) => {
      template += `(?property = <${attr}> && regex(str(?propertyValue), "${searchTerm}", "i"))`;
      if (attrIndex < searchByAttributes.length - 1) {
        template += " || ";
      }
    });

    template += ")";
  }

  template += `} LIMIT ${limit} OFFSET ${offset} }}`;
  return template;
};

export default keywordSearchTemplate;
