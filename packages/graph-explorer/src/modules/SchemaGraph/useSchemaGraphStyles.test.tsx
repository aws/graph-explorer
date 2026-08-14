// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { renderHookWithState } from "@/utils/testing";

import { useSchemaGraphStyles } from "./useSchemaGraphStyles";

// The schema view adds a `displayLabel` label to the base node/edge rules. Those
// base rules carry the per-type `data(ge_*)` style mappers (#2104), so the label
// must be MERGED in, not replace the rule — otherwise the schema graph renders
// unstyled. These guard that seam and its O(1) selector count.
describe("useSchemaGraphStyles", () => {
  it("retains the base node/edge data(ge_*) mappers alongside the schema label", () => {
    const { result } = renderHookWithState(() => useSchemaGraphStyles());
    const styles = result.current!;
    const node = styles.node as Record<string, unknown>;
    const edge = styles.edge as Record<string, unknown>;

    // Label override applied…
    expect(node["label"]).toBe("data(displayLabel)");
    expect(edge["label"]).toBe("data(displayLabel)");
    // …without clobbering the per-type style mappers.
    expect(node["background-color"]).toBe("data(ge_color)");
    expect(node["shape"]).toBe("data(ge_shape)");
    expect(edge["line-color"]).toBe("data(ge_lineColor)");
    expect(edge["color"]).toBe("data(ge_labelTextColor)");
  });

  it("stays O(1) in selector count", () => {
    const { result } = renderHookWithState(() => useSchemaGraphStyles());
    // node + edge + gated edge[ge_lineDashPattern]
    expect(Object.keys(result.current!).length).toBeLessThanOrEqual(6);
  });
});
