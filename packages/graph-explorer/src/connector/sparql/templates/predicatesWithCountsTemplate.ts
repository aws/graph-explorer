import dedent from "dedent";

/**
 * Fetch all distinct predicates to non-literals with counts
 */
export default function predicatesWithCountsTemplate() {
  return dedent`
    SELECT ?predicate (COUNT(?predicate) as ?count) {
      [] ?predicate ?object FILTER(!isLiteral(?object))
    } GROUP BY ?predicate
  `;
}
