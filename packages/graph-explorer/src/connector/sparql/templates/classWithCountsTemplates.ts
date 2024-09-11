import { query } from "@/utils";

// It returns the number of instances of the given class
export default function classWithCountsTemplates(className: string) {
  return query`
    # Fetch the number of instances of the given class
    SELECT (COUNT(?start) AS ?instancesCount) {
      ?start a <${className}>
    }
  `;
}
