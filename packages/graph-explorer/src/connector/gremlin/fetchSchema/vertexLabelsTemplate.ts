import type { QueryFragment } from "@/connector/queryFragment";

import { query } from "@/utils";

/**
 * It returns a Gremlin template to get all nodes labels and their counts
 */
export default function vertexLabelsTemplate(): QueryFragment {
  return query`g.V().groupCount().by(label)`;
}
