import type { EdgeType } from "@/core";

import { DEFAULT_SAMPLE_SIZE, query } from "@/utils";

import { fragment } from "../fragments";

/**
 * Keys of the projected endpoint labels. The template writes them and the
 * response parser reads them, so both derive from this object.
 */
export const projectionKeys = {
  sourceType: "s",
  targetType: "t",
} as const;

/**
 * Returns a Gremlin query that counts the endpoint label combinations of up to
 * `DEFAULT_SAMPLE_SIZE` edges of each given type, grouped by edge type.
 *
 * One limit after `hasLabel(A, B, ...)` would be shared, so a dominant type fills
 * it and the rest come back empty. Each type gets its own `union()` branch
 * instead, and on Neptune each branch is an index lookup by edge label.
 * Mid-traversal `V()` rather than `E()`, which needs TinkerPop 3.7, and anchored
 * on `V().limit(1)` because anchoring on `inject()` is not native on Neptune.
 *
 * Grouped by edge type before counting because Neptune's DFE engine cannot count
 * one `project()` key across several full branches: two took 54s and five timed
 * out, where grouping first handled ten in 9s.
 *
 * Callers send 10 types per request, so one request reads at most 100,000
 * edges. On a db.t3.medium, 100 types in one request took 116s and left the
 * instance refusing even a single-type sample for two minutes afterwards.
 *
 * The endpoint labels are folded because engines disagree on what `label()`
 * emits for a multi-label vertex. Neptune 1.4 emits one `::` composite, but
 * 1.3.5 emits each label separately, and a bare `by(outV().label())` keeps only
 * the first, silently dropping the vertex's other types.
 */
export default function edgeConnectionsTemplate({
  types,
}: {
  types: EdgeType[];
}) {
  const limit = fragment.number(DEFAULT_SAMPLE_SIZE);
  const branches = types.map(
    type => `V().outE(${fragment.identifier(type)}).limit(${limit})`,
  );
  const keys = Object.values(projectionKeys).map(fragment.identifier);

  return query`
    g.V().limit(1).union(${branches.join(", ")})
      .group()
        .by(label())
        .by(
          project(${keys.join(", ")})
            .by(outV().label().fold())
            .by(inV().label().fold())
            .groupCount()
        )
  `;
}
