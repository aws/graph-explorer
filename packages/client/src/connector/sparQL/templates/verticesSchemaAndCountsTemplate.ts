/**
 * This template returns:
 * 1. A list of rdf:Subject Class with a number of instances by Class
 * 2. All connected rdf:Predicate for each different Class
 */
const verticesSchemaAndCountsTemplate = () => {
  return `SELECT ?class ?predicate ?object ?instancesCount {
      ?sampleInstance ?predicate ?object {
        SELECT ?class (SAMPLE(?start) AS ?sampleInstance) (COUNT(?start) AS ?instancesCount) {
          ?start a ?class
        } 
        GROUP BY ?class
      }
    }`;
};

export default verticesSchemaAndCountsTemplate;
