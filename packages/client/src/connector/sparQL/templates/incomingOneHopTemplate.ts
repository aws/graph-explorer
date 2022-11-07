import type { NeighborsRequest } from "../../AbstractConnector";

/**
 * Fetch all neighbors whose source is the given vertex.
 *
 * @example
 * sourceId = "http://www.example.com/soccer/resource#London_Stadium"
 * vertexTypes = [
 *   "http://www.example.com/soccer/ontology/Stadium",
 *   "http://www.example.com/soccer/ontology/League"
 * ]
 * limit = 10
 * offset = 0
 *
 * SELECT *
 * {
 *   ?start ?property ?propertyValue
 *   {
 *     SELECT *
 *     {
 *       ?start ?edge <http://www.example.com/soccer/resource#London_Stadium>
 *       FILTER(!isLiteral(?start))
 *       {
 *         SELECT *
 *         {
 *           ?start a ?vertexType
 *           {
 *             SELECT *
 *             {
 *               ?target a ?targetVertexType
 *               FILTER(?target=<http://www.example.com/soccer/resource#London_Stadium>)
 *             }
 *           }
 *           FILTER(
 *             ?vertexType=<http://www.example.com/soccer/ontology/Stadium> ||
 *             ?vertexType=<http://www.example.com/soccer/ontology/League>
 *           )
 *         }
 *       }
 *     }
 *     LIMIT 10 OFFSET 0
 *   }
 * }
 */
const incomingOneHopTemplate = ({
  vertexId,
  vertexTypes = [],
  limit = 10,
  offset = 0,
}: NeighborsRequest): string => {
  let template = `SELECT * {?start ?property ?propertyValue { SELECT * {?start ?edge <${vertexId}> FILTER(!isLiteral(?start)) {SELECT * {?start a ?vertexType {SELECT * {?target a ?targetVertexType FILTER(?target=<${vertexId}>)}}`;

  if (vertexTypes.length > 0) {
    template += ` FILTER(`;
    vertexTypes?.map((vt, vtIndex) => {
      template += `?vertexType=<${vt}>`;
      if (vtIndex < vertexTypes.length - 1) {
        template += " || ";
      }
    });
    template += `) `;
  }

  template += `}}} LIMIT ${limit} OFFSET ${offset} } }`;

  return template;
};

export default incomingOneHopTemplate;
