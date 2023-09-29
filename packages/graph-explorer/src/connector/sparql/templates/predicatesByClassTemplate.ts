// Return all predicates which are connected from the given class
const predicatesByClassTemplate = (props: { class: string }) => {
  return `
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
};

export default predicatesByClassTemplate;
