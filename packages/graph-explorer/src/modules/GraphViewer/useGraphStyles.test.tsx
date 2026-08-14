// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import {
  createEdgeType,
  createVertexType,
  edgeStyleData,
  type EdgeStyle,
  vertexStyleData,
  type VertexStyle,
} from "@/core";
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

// Producer and consumer must stay in lockstep: a ge_* field added to
// graphElementStyleData without a matching data() mapper (or the reverse)
// silently drops the style. See docs/adr/20260813-element-data-style-mappers.md.
describe("style data round trip", () => {
  const vertexStyle: VertexStyle = {
    type: createVertexType("Person"),
    displayLabel: "Human",
    displayNameAttribute: "name",
    longDisplayNameAttribute: "bio",
    color: "#123456",
    iconUrl: "/icons/person.svg",
    iconImageType: "image/svg+xml",
    shape: "diamond",
    backgroundOpacity: 0.42,
    borderWidth: 3,
    borderColor: "#654321",
    borderStyle: "dashed",
  };

  const edgeStyle: EdgeStyle = {
    type: createEdgeType("knows"),
    displayLabel: "Knows",
    displayNameAttribute: "since",
    lineColor: "#0a0b0c",
    lineThickness: 4,
    lineStyle: "dotted",
    sourceArrowStyle: "circle",
    targetArrowStyle: "tee",
    labelColor: "#abcdef",
    labelBackgroundOpacity: 0.73,
    labelBorderColor: "#fedcba",
    labelBorderStyle: "dashed",
    labelBorderWidth: 2,
  };

  function producedKeys() {
    return new Set([
      ...Object.keys(vertexStyleData(vertexStyle, vertexStyle.iconUrl)),
      ...Object.keys(edgeStyleData(edgeStyle)),
    ]);
  }

  function mappedKeys(styles: ReturnType<typeof useGraphStyles>) {
    const keys = new Set<string>();
    for (const rule of Object.values(styles)) {
      for (const value of Object.values(rule as Record<string, unknown>)) {
        for (const [, key] of String(value).matchAll(/data\(([^)]+)\)/g)) {
          keys.add(key);
        }
      }
    }
    return keys;
  }

  it("has a data() mapper for every key the producers emit", () => {
    const { result } = renderHookWithState(() => useGraphStyles());
    const mapped = mappedKeys(result.current);
    const unmapped = [...producedKeys()].filter(key => !mapped.has(key)).sort();

    expect(
      unmapped,
      "style data keys produced with no data() mapper in the stylesheet",
    ).toEqual([]);
  });

  it("emits style data for every ge_ mapper in the stylesheet", () => {
    const { result } = renderHookWithState(() => useGraphStyles());
    const produced = producedKeys();
    // Non-ge_ mappers (e.g. displayName) come from the rendered entity, not these
    // producers, so only ge_ keys are the producers' contract.
    const unproduced = [...mappedKeys(result.current)]
      .filter(key => key.startsWith("ge_") && !produced.has(key))
      .sort();

    expect(
      unproduced,
      "ge_ mappers in the stylesheet that no producer emits",
    ).toEqual([]);
  });
});
