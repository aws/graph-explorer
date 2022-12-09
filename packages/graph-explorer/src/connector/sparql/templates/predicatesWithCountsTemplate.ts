/**
 * Fetch all distinct predicates to non-literals with counts
 */
const predicatesWithCountsTemplate = () => {
  return `
  SELECT ?predicate (COUNT(?predicate) as ?count) {
    [] ?predicate ?object FILTER(!isLiteral(?object))
  } GROUP BY ?predicate`;
};

export default predicatesWithCountsTemplate;
