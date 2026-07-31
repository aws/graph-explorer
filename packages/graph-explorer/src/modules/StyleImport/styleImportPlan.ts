import { isEqual } from "lodash";

import type { EdgeType, VertexType } from "@/core/entities";
import type {
  EdgeStyle,
  EdgeStyleStorage,
  VertexStyle,
  VertexStyleStorage,
} from "@/core/StateProvider/graphStyles";
import type { StylingParseResult } from "@/core/styling";

import {
  resolveEdgeStyle,
  resolveVertexStyle,
} from "@/core/StateProvider/graphStyles";

/**
 * Whether the type already has a user style the load would replace (`existing`)
 * or is brand new (`new`). Drives the "Current" vs. "Default" before-label on a
 * card and the New / Existing filter tabs.
 */
export type StyleImportStatus = "new" | "existing";

/**
 * One loadable style, ready to render as a before→after card. `incoming` is the
 * storage entry that gets written on load; `incomingStyle`/`currentStyle` are
 * the resolved styles the previews draw. A vertex and edge item are the same
 * shape apart from their branded type and style types, so the discriminated
 * `kind` keeps them in one list without losing type safety at the leaves.
 */
export type VertexStyleImportItem = {
  kind: "vertex";
  type: VertexType;
  status: StyleImportStatus;
  incoming: VertexStyleStorage;
  incomingStyle: VertexStyle;
  currentStyle: VertexStyle;
};

export type EdgeStyleImportItem = {
  kind: "edge";
  type: EdgeType;
  status: StyleImportStatus;
  incoming: EdgeStyleStorage;
  incomingStyle: EdgeStyle;
  currentStyle: EdgeStyle;
};

export type StyleImportItem = VertexStyleImportItem | EdgeStyleImportItem;

/**
 * The actionable load list plus how many types were dropped for resolving
 * identically to the current style. The count is surfaced in the footer so the
 * file's total and the visible count reconcile.
 */
export type StyleImportPlan = {
  items: StyleImportItem[];
  skippedCount: number;
};

/**
 * Turns a parsed styling file into the load plan: for each type, resolve the
 * incoming and current styles, drop the ones that resolve identically (a no-op
 * the user shouldn't have to decide about), and classify the rest as new or
 * existing. Comparison is at the resolved level so a file that merely sets a
 * field to its existing effective value is skipped, regardless of how the two
 * storage partials happen to differ.
 */
export function buildStyleImportPlan(
  parsed: StylingParseResult,
  currentVertexStyles: Map<VertexType, VertexStyleStorage>,
  currentEdgeStyles: Map<EdgeType, EdgeStyleStorage>,
): StyleImportPlan {
  const items: StyleImportItem[] = [];
  let skippedCount = 0;

  for (const [type, incoming] of parsed.vertexStyles) {
    const current = currentVertexStyles.get(type);
    const incomingStyle = resolveVertexStyle(type, incoming);
    const currentStyle = resolveVertexStyle(type, current);
    if (isEqual(incomingStyle, currentStyle)) {
      skippedCount++;
      continue;
    }
    items.push({
      kind: "vertex",
      type,
      status: current ? "existing" : "new",
      incoming,
      incomingStyle,
      currentStyle,
    });
  }

  for (const [type, incoming] of parsed.edgeStyles) {
    const current = currentEdgeStyles.get(type);
    const incomingStyle = resolveEdgeStyle(type, incoming);
    const currentStyle = resolveEdgeStyle(type, current);
    if (isEqual(incomingStyle, currentStyle)) {
      skippedCount++;
      continue;
    }
    items.push({
      kind: "edge",
      type,
      status: current ? "existing" : "new",
      incoming,
      incomingStyle,
      currentStyle,
    });
  }

  return { items, skippedCount };
}
