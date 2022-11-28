// It returns a list of classes with the number of instances for each class
const classesWithCountsTemplates = () => {
  return `
    SELECT ?class  (COUNT(?start) AS ?instancesCount) {
      ?start a ?class
    }
    GROUP BY ?class
  `;
};

export default classesWithCountsTemplates;
