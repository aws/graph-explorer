import type { QueryFragment } from "@/connector/queryFragment";

import { query } from "@/utils";

import { fragment } from "../fragments";

/**
 * It returns a Gremlin template to number of vertices of a particular label
 */
export default function vertexTypeCountTemplate(label: string): QueryFragment {
  return query`g.V().hasLabel(${fragment.identifier(label)}).count()`;
}
