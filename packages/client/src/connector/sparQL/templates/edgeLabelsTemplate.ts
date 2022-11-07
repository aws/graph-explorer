/**
 * Fetch all edge labels to non-literals and counts
 */
const edgeLabelsTemplate = () => {
  return "SELECT ?edgeType (COUNT(?edgeType) as ?count) {?start ?edgeType ?property FILTER(!isLiteral(?property))} GROUP BY ?edgeType";
};

export default edgeLabelsTemplate;
