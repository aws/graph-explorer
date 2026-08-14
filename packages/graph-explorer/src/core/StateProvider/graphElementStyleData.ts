import Color from "color";

import {
  appDefaultEdgeStyle,
  type EdgeStyle,
  type LineStyle,
  type VertexStyle,
} from "./graphStyles";

/**
 * Per-element style data pushed onto cytoscape `ele.data()` so a single
 * `node` / `edge` stylesheet rule can resolve per-type values via `data(...)`
 * mappers — collapsing the ~20k per-type selectors that used to lock up the
 * schema view (see #2104) to a fixed handful. Precomputes the two derived
 * fields (`ge_borderOpacity`, `ge_labelTextColor`) and the dotted→dashed +
 * dash-pattern remap so the style loop stays pure `data()`.
 */

/** Cytoscape's own default, used for solid lines, which ignore the pattern. */
const SOLID_PATTERN: readonly number[] = [6, 3];

/**
 * A `Map` so a `lineStyle` colliding with `Object.prototype` cannot resolve to a
 * function.
 */
const LINE_PATTERN = new Map<LineStyle, readonly number[]>([
  ["solid", SOLID_PATTERN],
  ["dashed", [5, 6]],
  ["dotted", [1, 2]],
]);

/** Emitted when a vertex type has no resolved icon; cytoscape's "no image" value. */
const NO_ICON = "none";

/**
 * ALWAYS_SET: every field below is set on every element, never omitted.
 *
 * `cy.json({ elements })` *merges* element data — `ele.data(obj)` adds and
 * overwrites keys but never deletes ones missing from the new object. A field
 * that is sometimes absent can therefore never be cleared once it has been
 * applied, stranding a stale value on an already-drawn element. That is why
 * there are no gated `node[…]` / `edge[…]` selectors for these.
 */

/** Data-mapper fields set on every rendered vertex. Feeds the single `node` rule. */
export type VertexStyleData = {
  ge_color: string;
  ge_backgroundOpacity: number;
  ge_borderColor: string;
  ge_borderWidth: number;
  ge_borderOpacity: 0 | 1;
  ge_borderStyle: LineStyle;
  ge_shape: VertexStyle["shape"];
  /** `"none"` when the type has no resolved icon. */
  ge_iconUrl: string;
};

/** Data-mapper fields set on every rendered edge. Feeds the single `edge` rule. */
export type EdgeStyleData = {
  ge_lineColor: string;
  ge_lineStyle: LineStyle;
  /** Cytoscape's default for solid lines, which ignore it. */
  ge_lineDashPattern: readonly number[];
  ge_sourceArrowShape: EdgeStyle["sourceArrowStyle"];
  ge_targetArrowShape: EdgeStyle["targetArrowStyle"];
  ge_labelTextColor: "#FFFFFF" | "#000000";
  ge_labelBackgroundOpacity: number;
  ge_labelBackgroundColor: string;
  ge_labelBorderWidth: number;
  ge_labelBorderColor: string;
  ge_labelBorderStyle: LineStyle;
  ge_lineThickness: number;
};

/**
 * Picks white-on-dark / black-on-light for a label against its background color.
 * Falls back to the default label color when unset: an imported style file can
 * carry an empty `labelColor`, and `new Color("")` throws.
 *
 * Deliberately not memoized. Profiling this at 0.1ms over a 10s expansion put it
 * far below the per-type resolution that dominates, so a module-level cache
 * would only add global state shared across stores and tests.
 */
export function labelTextColorFor(labelColor: string): "#FFFFFF" | "#000000" {
  return new Color(labelColor || appDefaultEdgeStyle.labelColor).isDark()
    ? "#FFFFFF"
    : "#000000";
}

/** Precomputed cytoscape data-mapper fields for a rendered vertex. */
export function vertexStyleData(
  style: VertexStyle,
  backgroundImage: string | undefined,
): VertexStyleData {
  return {
    ge_color: style.color,
    ge_backgroundOpacity: style.backgroundOpacity,
    ge_borderColor: style.borderColor,
    ge_borderWidth: style.borderWidth,
    ge_borderOpacity: style.borderWidth > 0 ? 1 : 0,
    ge_borderStyle: style.borderStyle,
    ge_shape: style.shape,
    ge_iconUrl: backgroundImage ?? NO_ICON,
  };
}

/** Precomputed cytoscape data-mapper fields for a rendered edge. */
export function edgeStyleData(style: EdgeStyle): EdgeStyleData {
  const lineStyle: LineStyle =
    style.lineStyle === "dotted" ? "dashed" : style.lineStyle;
  return {
    ge_lineColor: style.lineColor,
    ge_lineStyle: lineStyle,
    ge_sourceArrowShape: style.sourceArrowStyle,
    ge_targetArrowShape: style.targetArrowStyle,
    ge_labelTextColor: labelTextColorFor(style.labelColor),
    ge_labelBackgroundOpacity: style.labelBackgroundOpacity,
    ge_labelBackgroundColor: style.labelColor,
    ge_labelBorderWidth: style.labelBorderWidth,
    ge_labelBorderColor: style.labelBorderColor,
    ge_labelBorderStyle: style.labelBorderStyle,
    ge_lineThickness: style.lineThickness,
    ge_lineDashPattern: LINE_PATTERN.get(style.lineStyle) ?? SOLID_PATTERN,
  };
}
