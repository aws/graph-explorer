import { SPARQLBlankNodeNeighborsCountRequest } from "../../types";

/**
 * Count neighbors by class which are related with the given subject URI.
 *
 * @example
 * subQuery = Blank node sub-query where the blank node was found
 * limit = 10
 *
 * SELECT ?bNode ?class (COUNT(?class) AS ?count) {
 *   SELECT DISTINCT ?bNode ?subject ?class {
 *     ?subject a ?class .
 *     { ?subject ?p ?bNode }
 *     UNION
 *     { ?bNode ?p ?subject }
 *     { < subQuery >}
 *   }
 *   LIMIT 10
 * }
 * GROUP BY ?bNode ?class
 */
const blankNodeNeighborsCountTemplate = ({
  subQuery,
  limit = 0,
}: SPARQLBlankNodeNeighborsCountRequest) => {
  return `
    SELECT ?bNode ?class (COUNT(?class) AS ?count) {
      ?subject a ?class {
        SELECT DISTINCT ?bNode ?subject ?class {
          ?subject a ?class .
          { ?subject ?p ?bNode }
          UNION
          { ?bNode ?p ?subject }
          { ${subQuery} }
        }
        ${limit > 0 ? `LIMIT ${limit}` : ""}
      }
    }
    GROUP BY ?bNode ?class
  `;
};

export default blankNodeNeighborsCountTemplate;
