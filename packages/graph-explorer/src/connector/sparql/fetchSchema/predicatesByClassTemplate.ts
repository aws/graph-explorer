import type { VertexType } from "@/core";

import { query } from "@/utils";

import { idParam } from "../idParam";

// Return all predicates which are connected from the given class
export default function predicatesByClassTemplate(props: {
  class: VertexType;
}) {
  return query`
    # Return all predicates which are connected from the given class
    SELECT ?pred (SAMPLE(?object) as ?sample)
    WHERE {
      {
        SELECT ?subject
        WHERE {
          ?subject a ${idParam(props.class)}.
        }
        LIMIT 1
      }
      ?subject ?pred ?object.
      FILTER(!isBlank(?object) && isLiteral(?object))
    }
    GROUP BY ?pred
  `;
}
