import type { GraphProps } from "@/components/Graph";

/**
 * Cytoscape stylesheet for the graph canvas.
 *
 * Every per-type visual value is precomputed onto element `data()` by
 * `vertexStyleData` / `edgeStyleData` and read back through `data(...)`
 * mappers, so the stylesheet is O(1) in the number of types rather than one
 * selector per type — see #2104.
 *
 * There are no gated `node[…]` / `edge[…]` selectors: cytoscape merges element
 * data and never deletes a key, so a sometimes-absent field would strand a
 * stale value on an already-drawn element. Every field is always set, so every
 * mapper can live on the base rule.
 */
export default function useGraphStyles(): NonNullable<GraphProps["styles"]> {
  return CANVAS_STYLES;
}

const CANVAS_STYLES: NonNullable<GraphProps["styles"]> = {
  node: {
    "background-color": "data(ge_color)",
    "background-opacity": "data(ge_backgroundOpacity)",
    "border-color": "data(ge_borderColor)",
    "border-width": "data(ge_borderWidth)",
    "border-opacity": "data(ge_borderOpacity)",
    "border-style": "data(ge_borderStyle)",
    shape: "data(ge_shape)",
    "background-image": "data(ge_iconUrl)",
    width: 24,
    height: 24,
  },
  edge: {
    label: "data(displayName)",
    color: "data(ge_labelTextColor)",
    "line-color": "data(ge_lineColor)",
    "line-style": "data(ge_lineStyle)",
    "line-dash-pattern": "data(ge_lineDashPattern)",
    "source-arrow-shape": "data(ge_sourceArrowShape)",
    "source-arrow-color": "data(ge_lineColor)",
    "target-arrow-shape": "data(ge_targetArrowShape)",
    "target-arrow-color": "data(ge_lineColor)",
    "text-background-opacity": "data(ge_labelBackgroundOpacity)",
    "text-background-color": "data(ge_labelBackgroundColor)",
    "text-border-width": "data(ge_labelBorderWidth)",
    "text-border-color": "data(ge_labelBorderColor)",
    "text-border-style": "data(ge_labelBorderStyle)",
    width: "data(ge_lineThickness)",
    // Strings, not numbers: the mapper-heavy edge rule resolves to the union's
    // string/mapper branch, which rejects numeric literals; cytoscape coerces.
    "source-distance-from-node": "0",
    "target-distance-from-node": "0",
  },
};
