// It returns the number of instances of the given class
const classWithCountsTemplates = (className: string) => {
  return `
    SELECT (COUNT(?start) AS ?instancesCount) {
      ?start a <${className}>
    }
  `;
};

export default classWithCountsTemplates;
