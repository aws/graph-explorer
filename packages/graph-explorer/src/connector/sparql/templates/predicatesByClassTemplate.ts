import dedent from "dedent";

// Return all predicates which are connected from the given class
export default function predicatesByClassTemplate(props: { class: string }) {
  return dedent`
    SELECT ?pred (SAMPLE(?object) as ?sample)
    WHERE {
      {
        SELECT ?subject
        WHERE {
          ?subject a <${props.class}>.
        }
        LIMIT 1
      }
      ?subject ?pred ?object.
      FILTER(!isBlank(?object) && isLiteral(?object))
    }
    GROUP BY ?pred
  `;
}
