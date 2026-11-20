import type { QueryFragment } from "@/connector/queryFragment";

import { query } from "@/utils";

/**
 * It returns an OpenCypher template to get all edges labels and their counts
 */
function edgeLabelsTemplate(): QueryFragment {
  return query`MATCH ()-[e]-() RETURN type(e) AS label, count(*) AS count`;
}

export default edgeLabelsTemplate;
