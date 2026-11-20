import type { QueryFragment } from "@/connector/queryFragment";

import { query } from "@/utils";

import { fragment } from "../fragments";

/**
 * It returns an OpenCypher template to count the number of vertices of a particular label
 */
function vertexTypeCountTemplate(label: string): QueryFragment {
  return query`MATCH (v:${fragment.identifier(label)}) RETURN count(v) AS count`;
}

export default vertexTypeCountTemplate;
