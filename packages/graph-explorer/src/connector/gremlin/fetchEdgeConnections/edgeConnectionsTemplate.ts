import type { EdgeType } from "@/core";

import { DEFAULT_SAMPLE_SIZE, escapeString, query } from "@/utils";

/**
 * Returns a Gremlin query to discover distinct edge connection patterns for a specific edge type.
 * Uses sampling with dedup to efficiently discover patterns in large databases.
 *
 * The query samples edges of the given type and extracts the source and target vertex labels,
 * then deduplicates to find unique patterns.
 */
export default function edgeConnectionsTemplate(edgeType: EdgeType) {
  const escapedEdgeType = escapeString(edgeType);
  return query`
    g.E().hasLabel("${escapedEdgeType}").limit(${DEFAULT_SAMPLE_SIZE})
      .project('sourceType', 'targetType')
      .by(outV().label())
      .by(inV().label())
      .dedup()
  `;
}
