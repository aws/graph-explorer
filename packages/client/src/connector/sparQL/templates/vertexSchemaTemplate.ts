/**
 * Fetch all literal properties of a single instance of the given type.
 *
 * @example
 * type = http://www.example.com/soccer/ontology/Team
 *
 * SELECT ?property ?propertyValue {
 *   ?instance ?property ?propertyValue {
 *     SELECT * {
 *       ?instance a <http://www.example.com/soccer/ontology/Team>
 *     }
 *     LIMIT 1
 *   }
 *   FILTER(isLiteral(?propertyValue))
 * }
 *
 */
const vertexSchemaTemplate = ({ type }: { type: string }) => {
  return `SELECT ?property ?propertyValue { ?instance ?property ?propertyValue { SELECT * { ?instance a <${type}> } LIMIT 1 } FILTER(isLiteral(?propertyValue)) }`;
};

export default vertexSchemaTemplate;
