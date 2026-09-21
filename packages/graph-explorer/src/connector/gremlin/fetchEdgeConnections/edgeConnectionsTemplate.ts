import { query } from "@/utils";

import type { DiscoveryRequest } from "./discoveryPlan";

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
 * @param edgeTypes Restricts the scan. Omit to scan every edge, which is
 *   cheaper than naming every type when the whole graph fits one request.
 * @param limit Caps the edges scanned. Omit for the complete answer.
 */
export default function edgeConnectionsTemplate({
  edgeTypes,
  limit,
}: DiscoveryRequest) {
  const labelFilter = edgeTypes?.length
    ? `.hasLabel(${edgeTypes.map(fragment.identifier).join(", ")})`
    : "";
  const sampleCap =
    limit === undefined ? "" : `.limit(${fragment.number(limit)})`;
  const keys = Object.values(projectionKeys).map(fragment.identifier);

  return query`
    g.E()${labelFilter}${sampleCap}
      .groupCount()
        .by(
          project(${keys.join(", ")})
            .by(label())
            .by(outV().label())
            .by(inV().label())
        )
  `;
}
