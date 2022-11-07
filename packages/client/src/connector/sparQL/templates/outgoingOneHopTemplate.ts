import type { NeighborsRequest } from "../../AbstractConnector";

/**
 * Fetch all neighbors whose target is the given vertex.
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
 *
 * SELECT *
 * {
 *   ?target ?property ?propertyValue
 *   {
 *     SELECT *
 *     {
 *       <http://www.example.com/soccer/resource#London_Stadium> ?edge ?target
 *       FILTER(!isLiteral(?target))
 *       {
 *         SELECT *
 *         {
 *           ?target a ?vertexType
 *           {
 *             SELECT *
 *             {
 *               ?start a ?startVertexType
 *               FILTER(?start=<http://www.example.com/soccer/resource#London_Stadium>)
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
const outgoingOneHopTemplate = ({
  vertexId,
  vertexTypes = [],
  limit = 10,
  offset = 0,
}: NeighborsRequest): string => {
  let template = `SELECT * {?target ?property ?propertyValue { SELECT * {<${vertexId}> ?edge ?target FILTER(!isLiteral(?target)) {SELECT * {?target a ?vertexType {SELECT * {?start a ?startVertexType FILTER(?start=<${vertexId}>)}}`;

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

export default outgoingOneHopTemplate;
