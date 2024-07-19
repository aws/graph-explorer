import dedent from "dedent";

// It returns the number of instances of the given class
export default function classWithCountsTemplates(className: string) {
  return dedent`
    # Fetch the number of instances of the given class
    SELECT (COUNT(?start) AS ?instancesCount) {
      ?start a <${className}>
    }
  `;
}
