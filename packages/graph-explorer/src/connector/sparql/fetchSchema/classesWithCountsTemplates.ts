import { query } from "@/utils";

// It returns a list of classes with the number of instances for each class
export default function classesWithCountsTemplates() {
  return query`
    # Fetch a list of classes with the number of instances for each class
    SELECT ?class  (COUNT(?start) AS ?instancesCount) {
      ?start a ?class
    }
    GROUP BY ?class
  `;
}
