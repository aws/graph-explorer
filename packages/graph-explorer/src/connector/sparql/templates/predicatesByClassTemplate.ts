// Return all predicates which are connected from the given class
const predicatesByClassTemplate = (props: { class: string }) => {
  return `
    SELECT DISTINCT ?pred ?object
    WHERE {
      ?subject a <${props.class}>;
        ?pred ?object.
      FILTER(!isBlank(?object) && isLiteral(?object))
    }
    LIMIT 1
  `;
};

export default predicatesByClassTemplate;
