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
    expect(selectors).toEqual(["edge", "edge[ge_lineDashPattern]", "node"]);
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

  it("gates line-dash-pattern on ge_lineDashPattern presence", () => {
    // Solid edges omit the field and fall through to the default; only dashed/
    // dotted edges pick up the pattern via the gated selector.
    const { result } = renderHookWithState(() => useGraphStyles());
    const dashRule = result.current["edge[ge_lineDashPattern]"] as Record<
      string,
      unknown
    >;
    expect(dashRule["line-dash-pattern"]).toBe("data(ge_lineDashPattern)");
  });
});
