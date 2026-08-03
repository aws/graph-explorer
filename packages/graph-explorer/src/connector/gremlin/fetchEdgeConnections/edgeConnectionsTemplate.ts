import type { EdgeType } from "@/core";

import { DEFAULT_SAMPLE_SIZE, query } from "@/utils";

import { fragment } from "../fragments";

/**
 * Returns a Gremlin query to discover distinct edge connection patterns for a specific edge type.
 * Uses sampling with dedup to efficiently discover patterns in large databases.
 *
 * The query samples edges of the given type and extracts the source and target vertex labels,
 * then deduplicates to find unique patterns.
 */
export default function edgeConnectionsTemplate(edgeType: EdgeType) {
  return query`
    g.E().hasLabel(${fragment.identifier(edgeType)}).limit(${DEFAULT_SAMPLE_SIZE})
      .project('sourceType', 'targetType')
      .by(outV().label())
      .by(inV().label())
      .dedup()
  `;
}
