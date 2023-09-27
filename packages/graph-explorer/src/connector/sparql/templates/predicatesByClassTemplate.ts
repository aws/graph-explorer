// Return all predicates which are connected from the given class
const predicatesByClassTemplate = (props: { class: string }) => {
  return `
    SELECT DISTINCT ?pred ?object
    WHERE {
      {
        SELECT ?subject
        WHERE {
          ?subject a <${props.class}>;
        }
        LIMIT 1
      }
      ?subject ?pred ?object.
      FILTER(!isBlank(?object) && isLiteral(?object))
    }
  `;
};

export default predicatesByClassTemplate;
