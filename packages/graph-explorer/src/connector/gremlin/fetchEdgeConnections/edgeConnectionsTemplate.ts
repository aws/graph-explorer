import type { EdgeType } from "@/core";

import { DEFAULT_SAMPLE_SIZE, query } from "@/utils";

import { fragment } from "../fragments";

/**
 * Returns a Gremlin query that discovers distinct edge connection patterns for a
 * batch of edge types in a single request.
 *
 * `g.E().hasLabel(...)` is a native, index-backed edge scan on Neptune; the
 * `group().by(label())` reduction buckets the edges by edge type, and each
 * bucket samples up to `DEFAULT_SAMPLE_SIZE` edges and projects the distinct
 * (source label, target label) pairs. The caller regroups by the returned edge
 * label.
 *
 * The `limit` sits inside the `group()` value traversal, which TinkerPop runs
 * per group, so each edge type is sampled independently — no shared cap that
 * starves rarer types. It bounds the per-type label-resolution and dedup work,
 * not the initial edge scan: `group()` still enumerates every edge of the
 * batched types to bucket them. A per-type scan cap is not expressible in one
 * native TinkerPop 3.6.2 request.
 */
export default function edgeConnectionsTemplate({
  types,
}: {
  types: EdgeType[];
}) {
  const labels = types.map(fragment.identifier);

  return query`
    g.E().hasLabel(${labels.join(", ")})
      .group()
        .by(label())
        .by(
          limit(${DEFAULT_SAMPLE_SIZE})
            .project('sourceType', 'targetType')
            .by(outV().label())
            .by(inV().label())
            .dedup()
            .fold()
        )
  `;
}
