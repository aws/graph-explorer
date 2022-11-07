/**
 * Fetch all vertex labels and counts
 */
const vertexLabelsTemplate = () => {
  return "SELECT ?vertexType (COUNT(?vertexType) as ?count) {?start a ?vertexType} GROUP BY ?vertexType";
};

export default vertexLabelsTemplate;
