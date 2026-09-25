import { query } from "@/utils";

import type {
  DiscoveryRequest,
  SampleRequest,
  ScanRequest,
} from "./discoveryPlan";

import { fragment } from "../fragments";

/**
 * Keys of the projected triple that identifies one edge connection.
 *
 * Single letters because they repeat once per distinct combination, and a graph
 * with ten thousand edge types returns ten thousand of them. The template writes
 * them and the response parser reads them, so both derive from this object.
 */
export const projectionKeys = {
  edgeType: "e",
  sourceType: "s",
  targetType: "t",
} as const;

/**
 * Returns a Gremlin query that counts the distinct
 * `(edge type, source label, target label)` combinations in one request.
 *
 * `groupCount()` keyed by a `project()` is native on every Neptune engine we
 * tested and on reference TinkerPop 3.6.2, and its accumulator is keyed by the
 * answer rather than the input, so it holds one entry per distinct combination
 * instead of one per edge. That is what makes it survive a graph the previous
 * `group().by(label())` shape ran out of memory on.
 *
 * The key must be a named `project()`. A `union()` of the three labels is also
 * native but does not guarantee order, and Neptune's DFE engine permuted it,
 * silently reporting edges in the wrong direction. See the ADR.
 *
 * The endpoint labels are folded because engines disagree on what `label()`
 * emits for a multi-label vertex. Neptune 1.4 emits one `::` composite, but
 * 1.3.5 emits each label separately, and a bare `by(outV().label())` keeps only
 * the first, silently dropping the vertex's other types.
 *
 * A sampled request is shaped differently. See {@link sampledEdgesTemplate}.
 */
export default function edgeConnectionsTemplate(request: DiscoveryRequest) {
  return "limitPerType" in request
    ? sampledEdgesTemplate(request)
    : scannedEdgesTemplate(request);
}

function scannedEdgesTemplate({ edgeTypes }: ScanRequest) {
  const edges = edgeTypes?.length
    ? `g.E().hasLabel(${edgeTypes.map(fragment.identifier).join(", ")})`
    : "g.E()";
  const keys = Object.values(projectionKeys).map(fragment.identifier);

  return query`
    ${edges}
      .groupCount()
        .by(
          project(${keys.join(", ")})
            .by(label())
            .by(outV().label().fold())
            .by(inV().label().fold())
        )
  `;
}

/**
 * Counts the endpoint label combinations of up to `limitPerType` edges of each
 * named type, grouped by edge type.
 *
 * One limit after `hasLabel(A, B, ...)` would be shared, so a dominant type fills
 * it and the rest come back empty. Each type gets its own `union()` branch
 * instead, and on Neptune each branch is an index lookup by edge label.
 * Mid-traversal `V()` rather than `E()`, which needs TinkerPop 3.7, and anchored
 * on `V().limit(1)` because anchoring on `inject()` is not native on Neptune.
 *
 * Grouped by edge type first, unlike the scan, because Neptune's DFE engine
 * cannot count one `project()` key across several full branches: two took 54s
 * and five timed out, where grouping first handled ten in 9s. Grouping holds
 * each type's sample until it is counted, which the per-type limit bounds, and
 * is why the scan, which has no limit, cannot use it.
 */
function sampledEdgesTemplate({ edgeTypes, limitPerType }: SampleRequest) {
  const limit = fragment.number(limitPerType);
  const branches = edgeTypes.map(
    type => `V().outE(${fragment.identifier(type)}).limit(${limit})`,
  );
  const keys = [projectionKeys.sourceType, projectionKeys.targetType].map(
    fragment.identifier,
  );

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
