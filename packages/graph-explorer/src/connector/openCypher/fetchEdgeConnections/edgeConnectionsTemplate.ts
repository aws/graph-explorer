import type { EdgeType } from "@/core";

import { DEFAULT_SAMPLE_SIZE, query } from "@/utils";

/**
 * Returns an openCypher query to discover distinct edge connection patterns for a specific edge type.
 * Uses sampling with DISTINCT to efficiently discover patterns in large databases.
 *
 * The query samples edges of the given type and extracts the source and target vertex labels,
 * returning full label arrays to support multi-label vertices.
 */
export default function edgeConnectionsTemplate(edgeType: EdgeType) {
  return query`
    MATCH (s)-[e:\`${edgeType}\`]->(t)
    WITH labels(s) AS sourceLabels, labels(t) AS targetLabels
    LIMIT ${DEFAULT_SAMPLE_SIZE}
    RETURN DISTINCT sourceLabels, targetLabels
  `;
}
