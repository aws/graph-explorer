import type { QueryFragment } from "@/connector/queryFragment";

import { query } from "@/utils";

import { fragment } from "../fragments";

// It returns the number of instances of the given class
export default function classWithCountsTemplates(
  className: string,
): QueryFragment {
  return query`
    # Fetch the number of instances of the given class
    SELECT (COUNT(?start) AS ?instancesCount) {
      ?start a ${fragment.iri(className)}
    }
  `;
}
