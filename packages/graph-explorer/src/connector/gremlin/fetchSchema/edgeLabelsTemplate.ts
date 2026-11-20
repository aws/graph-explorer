import type { QueryFragment } from "@/connector/queryFragment";

import { query } from "@/utils";

/**
 * It returns a Gremlin template to get all edges labels and their counts
 */
export default function edgeLabelsTemplate(): QueryFragment {
  return query`g.E().groupCount().by(label)`;
}
