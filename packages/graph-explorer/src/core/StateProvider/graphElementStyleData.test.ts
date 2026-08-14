import { describe, expect, it } from "vitest";

import {
  appDefaultEdgeStyle,
  appDefaultVertexStyle,
  createEdgeType,
  createVertexType,
  type EdgeStyle,
  type VertexStyle,
} from "@/core";

import {
  edgeStyleData,
  labelTextColorFor,
  vertexStyleData,
} from "./graphElementStyleData";

const vertex = (overrides: Partial<VertexStyle> = {}) =>
  ({
    ...appDefaultVertexStyle,
    type: createVertexType("Person"),
    ...overrides,
  }) satisfies VertexStyle;

const edge = (overrides: Partial<EdgeStyle> = {}) =>
  ({
    ...appDefaultEdgeStyle,
    type: createEdgeType("knows"),
    ...overrides,
  }) satisfies EdgeStyle;

describe("vertexStyleData", () => {
  it("copies scalar fields verbatim", () => {
    const style = vertex();
    const data = vertexStyleData(style, undefined);
    expect(data.ge_color).toBe(style.color);
    expect(data.ge_backgroundOpacity).toBe(style.backgroundOpacity);
    expect(data.ge_shape).toBe(style.shape);
  });

  it("derives ge_borderOpacity from borderWidth", () => {
    expect(
      vertexStyleData(vertex({ borderWidth: 0 }), undefined).ge_borderOpacity,
    ).toBe(0);
    expect(
      vertexStyleData(vertex({ borderWidth: 2 }), undefined).ge_borderOpacity,
    ).toBe(1);
  });

  // Always set, never omitted: cytoscape merges element data and never deletes a
  // key, so an absent field could not clear a previously applied icon.
  it("always sets ge_iconUrl, using none when there is no icon", () => {
    expect(vertexStyleData(vertex(), undefined).ge_iconUrl).toBe("none");
    expect(vertexStyleData(vertex(), "img").ge_iconUrl).toBe("img");
  });
});

describe("edgeStyleData", () => {
  it("copies scalar fields verbatim", () => {
    const style = edge();
    const data = edgeStyleData(style);
    expect(data.ge_lineColor).toBe(style.lineColor);
    expect(data.ge_sourceArrowShape).toBe(style.sourceArrowStyle);
    expect(data.ge_targetArrowShape).toBe(style.targetArrowStyle);
    expect(data.ge_lineThickness).toBe(style.lineThickness);
  });

  it("remaps dotted line style to dashed for cytoscape rendering", () => {
    // cytoscape renders "dotted" identically to solid at some widths; the app
    // renders dotted via a dashed style + tight dash pattern (see LINE_PATTERN).
    expect(edgeStyleData(edge({ lineStyle: "solid" })).ge_lineStyle).toBe(
      "solid",
    );
    expect(edgeStyleData(edge({ lineStyle: "dashed" })).ge_lineStyle).toBe(
      "dashed",
    );
    expect(edgeStyleData(edge({ lineStyle: "dotted" })).ge_lineStyle).toBe(
      "dashed",
    );
  });

  it("always sets ge_lineDashPattern, using the default for solid lines", () => {
    expect(
      edgeStyleData(edge({ lineStyle: "solid" })).ge_lineDashPattern,
    ).toEqual([6, 3]);
    expect(
      edgeStyleData(edge({ lineStyle: "dashed" })).ge_lineDashPattern,
    ).toEqual([5, 6]);
    expect(
      edgeStyleData(edge({ lineStyle: "dotted" })).ge_lineDashPattern,
    ).toEqual([1, 2]);
  });

  it("picks label text color for readability against the label background", () => {
    expect(
      edgeStyleData(edge({ labelColor: "#17457b" })).ge_labelTextColor,
    ).toBe("#FFFFFF");
    expect(
      edgeStyleData(edge({ labelColor: "#ffffff" })).ge_labelTextColor,
    ).toBe("#000000");
  });

  it("does not throw on an empty labelColor (reachable via style import)", () => {
    // new Color("") throws; an imported style file can carry an empty labelColor.
    expect(() => edgeStyleData(edge({ labelColor: "" }))).not.toThrow();
    expect(edgeStyleData(edge({ labelColor: "" })).ge_labelTextColor).toBe(
      "#FFFFFF",
    );
  });
});

describe("labelTextColorFor", () => {
  it("matches the readability pick used across previews and canvas", () => {
    expect(labelTextColorFor("#000000")).toBe("#FFFFFF");
    expect(labelTextColorFor("#ffffff")).toBe("#000000");
  });

  it("falls back to the default label color instead of throwing on empty", () => {
    expect(() => labelTextColorFor("")).not.toThrow();
    expect(labelTextColorFor("")).toBe("#FFFFFF");
  });

  it("returns a stable answer across repeated calls", () => {
    expect(labelTextColorFor("#123456")).toBe(labelTextColorFor("#123456"));
    expect(labelTextColorFor("")).toBe(labelTextColorFor(""));
  });

  it("answers per color rather than returning one answer for all", () => {
    expect(labelTextColorFor("#000000")).not.toBe(labelTextColorFor("#ffffff"));
  });
});
