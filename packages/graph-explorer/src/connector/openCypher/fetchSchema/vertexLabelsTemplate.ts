import type { QueryFragment } from "@/connector/queryFragment";

import { query } from "@/utils";

/**
 * It returns an OpenCypher template to get all nodes labels and their counts
 */
function vertexLabelsTemplate(): QueryFragment {
  return query`MATCH (v) RETURN labels(v) AS label, count(v) AS count`;
}

export default vertexLabelsTemplate;
