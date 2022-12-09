// Return all predicates which are connected from the given class
const predicatesByClassTemplate = (props: { class: string }) => {
  return `
    SELECT DISTINCT ?pred (SAMPLE(?object) as ?sample) {
        ?subject a     <${props.class}>;
                 ?pred ?object.
        FILTER(!isBlank(?object) && isLiteral(?object))
    }
    GROUP BY ?pred
  `;
};

export default predicatesByClassTemplate;
