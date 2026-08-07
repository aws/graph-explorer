import { isEqual } from "lodash";

import type { EdgeType, VertexType } from "@/core/entities";
import type {
  EdgeStyle,
  EdgeStyleStorage,
  StyleCondition,
  VertexStyle,
  VertexStyleStorage,
} from "@/core/StateProvider/graphStyles";
import type { StylingParseResult } from "@/core/styling";

import {
  resolveConditionalEdgeStyle,
  resolveConditionalVertexStyle,
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
 * A type's conditional style is a separately selectable item so the user can
 * import the base style without the condition (or vice versa). The `base`
 * variant writes the entry without a condition; the `conditional` variant writes
 * the full entry including the condition, so selecting it always brings the base
 * along and no cross-item dependency is needed.
 */
export type StyleImportVariant = "base" | "conditional";

/**
 * One loadable style, ready to render as a before→after card. `incoming` is the
 * storage entry that gets written on load; `incomingStyle`/`currentStyle` are
 * the resolved styles the previews draw (for a `conditional` item, the "before"
 * is the base appearance and the "after" is the condition-met appearance). A
 * vertex and edge item are the same shape apart from their branded type and
 * style types, so the discriminated `kind` keeps them in one list without losing
 * type safety at the leaves.
 */
export type VertexStyleImportItem = {
  kind: "vertex";
  type: VertexType;
  status: StyleImportStatus;
  incoming: VertexStyleStorage;
  incomingStyle: VertexStyle;
  currentStyle: VertexStyle;
} & (
  | { variant: "base" }
  | { variant: "conditional"; condition: StyleCondition }
);

export type EdgeStyleImportItem = {
  kind: "edge";
  type: EdgeType;
  status: StyleImportStatus;
  incoming: EdgeStyleStorage;
  incomingStyle: EdgeStyle;
  currentStyle: EdgeStyle;
} & (
  | { variant: "base" }
  | { variant: "conditional"; condition: StyleCondition }
);

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
 * A resolved style without its conditional block, so the base item's no-op
 * check compares only the base appearance — a type whose base is unchanged but
 * whose condition is new should still surface (as a conditional item).
 */
function baseAppearance<S extends { conditionalStyle?: unknown }>(
  style: S,
): Omit<S, "conditionalStyle"> {
  const { conditionalStyle: _drop, ...rest } = style;
  return rest;
}

/**
 * Turns a parsed styling file into the load plan. Each type yields up to two
 * items: a `base` item (the style without its condition) and, when the file
 * carries one, a `conditional` item. Items that resolve identically to the
 * current style are dropped; a type is counted as skipped only when it yields no
 * items at all. Comparison is at the resolved level so a file that merely sets a
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
    const { conditionalStyle, ...baseIncoming } = incoming;

    const baseIncomingStyle = resolveVertexStyle(type, baseIncoming);
    const currentStyle = resolveVertexStyle(type, current);
    let emitted = false;

    if (
      !isEqual(baseAppearance(baseIncomingStyle), baseAppearance(currentStyle))
    ) {
      items.push({
        kind: "vertex",
        variant: "base",
        type,
        status: current ? "existing" : "new",
        incoming: baseIncoming,
        incomingStyle: baseIncomingStyle,
        currentStyle,
      });
      emitted = true;
    }

    const incomingConditional = resolveConditionalVertexStyle(
      resolveVertexStyle(type, incoming),
    );
    if (conditionalStyle && incomingConditional) {
      const currentConditionalStyle = current
        ? resolveConditionalVertexStyle(resolveVertexStyle(type, current))
            ?.style
        : undefined;
      if (!isEqual(incomingConditional.style, currentConditionalStyle)) {
        items.push({
          kind: "vertex",
          variant: "conditional",
          type,
          status: current?.conditionalStyle ? "existing" : "new",
          condition: conditionalStyle.condition,
          incoming,
          incomingStyle: incomingConditional.style,
          currentStyle: baseIncomingStyle,
        });
        emitted = true;
      }
    }

    if (!emitted) {
      skippedCount++;
    }
  }

  for (const [type, incoming] of parsed.edgeStyles) {
    const current = currentEdgeStyles.get(type);
    const { conditionalStyle, ...baseIncoming } = incoming;

    const baseIncomingStyle = resolveEdgeStyle(type, baseIncoming);
    const currentStyle = resolveEdgeStyle(type, current);
    let emitted = false;

    if (
      !isEqual(baseAppearance(baseIncomingStyle), baseAppearance(currentStyle))
    ) {
      items.push({
        kind: "edge",
        variant: "base",
        type,
        status: current ? "existing" : "new",
        incoming: baseIncoming,
        incomingStyle: baseIncomingStyle,
        currentStyle,
      });
      emitted = true;
    }

    const incomingConditional = resolveConditionalEdgeStyle(
      resolveEdgeStyle(type, incoming),
    );
    if (conditionalStyle && incomingConditional) {
      const currentConditionalStyle = current
        ? resolveConditionalEdgeStyle(resolveEdgeStyle(type, current))?.style
        : undefined;
      if (!isEqual(incomingConditional.style, currentConditionalStyle)) {
        items.push({
          kind: "edge",
          variant: "conditional",
          type,
          status: current?.conditionalStyle ? "existing" : "new",
          condition: conditionalStyle.condition,
          incoming,
          incomingStyle: incomingConditional.style,
          currentStyle: baseIncomingStyle,
        });
        emitted = true;
      }
    }

    if (!emitted) {
      skippedCount++;
    }
  }

  return { items, skippedCount };
}
