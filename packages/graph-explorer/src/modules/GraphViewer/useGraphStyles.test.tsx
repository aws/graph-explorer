// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { renderHookWithState } from "@/utils/testing";

import useGraphStyles from "./useGraphStyles";

// The stylesheet is now O(1) in the number of types: every per-type value flows
// onto element `data()` via `vertexStyleData` / `edgeStyleData` and the rules
// read them via `data(...)` mappers. See #2104.
describe("useGraphStyles", () => {
  it("emits one node rule + one edge rule + one gated dash-pattern rule", () => {
    const { result } = renderHookWithState(() => useGraphStyles());
    const selectors = Object.keys(result.current).sort();
    expect(selectors).toEqual(["edge", "node"]);
  });

  it("uses data() mappers for every per-type property", () => {
    const { result } = renderHookWithState(() => useGraphStyles());
    const styles = result.current;
    const nodeRule = styles.node as Record<string, unknown>;
    const edgeRule = styles.edge as Record<string, unknown>;

    // Node — every per-type visual reads from element data.
    expect(nodeRule["background-color"]).toBe("data(ge_color)");
    expect(nodeRule["background-opacity"]).toBe("data(ge_backgroundOpacity)");
    expect(nodeRule["border-color"]).toBe("data(ge_borderColor)");
    expect(nodeRule["border-width"]).toBe("data(ge_borderWidth)");
    expect(nodeRule["border-opacity"]).toBe("data(ge_borderOpacity)");
    expect(nodeRule["border-style"]).toBe("data(ge_borderStyle)");
    expect(nodeRule["shape"]).toBe("data(ge_shape)");

    // Edge — every per-type visual reads from element data.
    expect(edgeRule["color"]).toBe("data(ge_labelTextColor)");
    expect(edgeRule["line-color"]).toBe("data(ge_lineColor)");
    expect(edgeRule["line-style"]).toBe("data(ge_lineStyle)");
    expect(edgeRule["source-arrow-shape"]).toBe("data(ge_sourceArrowShape)");
    expect(edgeRule["target-arrow-shape"]).toBe("data(ge_targetArrowShape)");
    expect(edgeRule["width"]).toBe("data(ge_lineThickness)");
  });

  // No gated selector: every element always sets the field, because cytoscape
  // merges element data and could never clear an absent one.
  it("maps line-dash-pattern on the base edge rule", () => {
    const { result } = renderHookWithState(() => useGraphStyles());
    const edgeRule = result.current["edge"] as Record<string, unknown>;
    expect(edgeRule["line-dash-pattern"]).toBe("data(ge_lineDashPattern)");
  });

  it("maps background-image on the base node rule", () => {
    const { result } = renderHookWithState(() => useGraphStyles());
    const nodeRule = result.current["node"] as Record<string, unknown>;
    expect(nodeRule["background-image"]).toBe("data(ge_iconUrl)");
  });
});
