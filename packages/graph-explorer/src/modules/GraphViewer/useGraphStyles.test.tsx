// @vitest-environment happy-dom
import type cytoscape from "cytoscape";

import { act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import type { GraphProps } from "@/components/Graph";

import {
  createEdgeType,
  createVertexType,
  type EdgeTypeConfig,
  getAppStore,
  userVertexStylesAtom,
  type VertexTypeConfig,
} from "@/core";
import {
  createHeadlessGraph,
  createRandomEdgeTypeConfig,
  createRandomVertexTypeConfig,
  DbState,
  renderHookWithState,
  resolvedStyle,
} from "@/utils/testing";

import useGraphStyles from "./useGraphStyles";

// A data: raster resolves synchronously to its url, so this test can exercise
// the real icon pipeline and still pin the expected background image.
const RASTER_ICON = {
  iconUrl: "data:image/png;base64,QUJD",
  iconImageType: "image/png",
} as const;

const SOURCE_ID = "source";
const TARGET_ID = "target";

function vertexElement(id: string, type: string): cytoscape.ElementDefinition {
  return { group: "nodes", data: { id, type } };
}

function edgeElement(
  id: string,
  type: string,
  displayName: string,
): cytoscape.ElementDefinition {
  return {
    group: "edges",
    data: { id, type, displayName, source: SOURCE_ID, target: TARGET_ID },
  };
}

/** Edge elements together with the source and target nodes they need. */
function withEndpoints(
  ...edges: cytoscape.ElementDefinition[]
): cytoscape.ElementDefinition[] {
  return [
    vertexElement(SOURCE_ID, "Endpoint"),
    vertexElement(TARGET_ID, "Endpoint"),
    ...edges,
  ];
}

describe("useGraphStyles", () => {
  let dbState: DbState;

  function getStyles(result: { current: GraphProps["styles"] | undefined }) {
    if (!result.current) {
      throw new Error("result.current is undefined");
    }
    return result.current;
  }

  function renderStyles() {
    return renderHookWithState(() => useGraphStyles(), dbState);
  }

  function withEdgeType(type: string, config: Partial<EdgeTypeConfig>) {
    const edgeConfig = {
      ...createRandomEdgeTypeConfig(),
      ...config,
      type: createEdgeType(type),
    };
    dbState.activeSchema.edges.push(edgeConfig);
    dbState.addEdgeStyle(edgeConfig.type, edgeConfig);
  }

  function withVertexType(type: string, config: Partial<VertexTypeConfig>) {
    const vertexConfig = {
      ...createRandomVertexTypeConfig(),
      ...config,
      type: createVertexType(type),
    };
    dbState.activeSchema.vertices.push(vertexConfig);
    dbState.addVertexStyle(vertexConfig.type, vertexConfig);
  }

  function styleOfEdge(
    styles: GraphProps["styles"],
    type: string,
    properties: string[],
  ) {
    const cy = createHeadlessGraph(
      styles,
      withEndpoints(edgeElement("e", type, `${type} name`)),
    );
    return resolvedStyle(cy.getElementById("e"), properties);
  }

  function styleOfVertex(
    styles: GraphProps["styles"],
    type: string,
    properties: string[],
  ) {
    const cy = createHeadlessGraph(styles, [vertexElement("v", type)]);
    return resolvedStyle(cy.getElementById("v"), properties);
  }

  beforeEach(() => {
    dbState = new DbState();
    dbState.activeSchema.vertices = [];
    dbState.activeSchema.edges = [];
  });

  it("serves every type through one node rule and one edge rule", () => {
    withVertexType("Person", {});
    withVertexType("Company", {});
    withVertexType("City", {});
    withEdgeType("KNOWS", {});
    withEdgeType("WORKS_AT", {});
    withEdgeType("LIVES_IN", {});

    const { result } = renderStyles();

    expect(Object.keys(getStyles(result))).toStrictEqual([
      "node[type]",
      "edge[type]",
    ]);
  });

  it("styles a vertex by its type", async () => {
    withVertexType("Person", {
      ...RASTER_ICON,
      color: "#128EE5",
      backgroundOpacity: 0.8,
      borderColor: "#000000",
      borderWidth: 2,
      borderStyle: "solid",
      shape: "ellipse",
    });

    const { result } = renderStyles();

    await waitFor(() => {
      const style = styleOfVertex(getStyles(result), "Person", [
        "background-image",
        "background-color",
        "background-opacity",
        "border-color",
        "border-width",
        "border-opacity",
        "border-style",
        "shape",
        "width",
        "height",
      ]);
      // The raster is wrapped in a padded square svg so the canvas can fit it
      // without measuring (issue #2108). Decode and check the wrapper nests the
      // icon's real url, since a bare prefix check passes for a lost url too.
      const backgroundImage = style["background-image"];
      expect(backgroundImage.startsWith("data:image/svg+xml;utf8,")).toBe(true);
      expect(decodeURIComponent(backgroundImage)).toContain(
        RASTER_ICON.iconUrl,
      );
      expect(style).toStrictEqual({
        "background-image": backgroundImage,
        "background-color": "rgb(18,142,229)",
        "background-opacity": "0.8",
        "border-color": "rgb(0,0,0)",
        "border-width": "2px",
        "border-opacity": "1",
        "border-style": "solid",
        shape: "ellipse",
        width: "24px",
        height: "24px",
      });
    });
  });

  it("styles an edge by its type", () => {
    withEdgeType("KNOWS", {
      labelColor: "#17457b",
      lineColor: "#b3b3b3",
      lineStyle: "solid",
      lineThickness: 2,
      sourceArrowStyle: "none",
      targetArrowStyle: "triangle",
      labelBackgroundOpacity: 0.8,
      labelBorderWidth: 1,
      labelBorderColor: "#000000",
      labelBorderStyle: "solid",
    });

    const { result } = renderStyles();

    expect(
      styleOfEdge(getStyles(result), "KNOWS", [
        "label",
        "color",
        "line-color",
        "line-style",
        "source-arrow-shape",
        "source-arrow-color",
        "target-arrow-shape",
        "target-arrow-color",
        "text-background-opacity",
        "text-background-color",
        "text-border-width",
        "text-border-color",
        "text-border-style",
        "width",
        "source-distance-from-node",
        "target-distance-from-node",
      ]),
    ).toStrictEqual({
      label: "KNOWS name",
      color: "rgb(255,255,255)",
      "line-color": "rgb(179,179,179)",
      "line-style": "solid",
      "source-arrow-shape": "none",
      "source-arrow-color": "rgb(179,179,179)",
      "target-arrow-shape": "triangle",
      "target-arrow-color": "rgb(179,179,179)",
      "text-background-opacity": "0.8",
      "text-background-color": "rgb(23,69,123)",
      "text-border-width": "1px",
      "text-border-color": "rgb(0,0,0)",
      "text-border-style": "solid",
      width: "2px",
      "source-distance-from-node": "0px",
      "target-distance-from-node": "0px",
    });
  });

  it("shows the border only when its width is non-zero", () => {
    withVertexType("Bordered", { borderWidth: 3 });
    withVertexType("Borderless", { borderWidth: 0 });

    const { result } = renderStyles();
    const styles = getStyles(result);

    expect(styleOfVertex(styles, "Bordered", ["border-opacity"])).toStrictEqual(
      { "border-opacity": "1" },
    );
    expect(
      styleOfVertex(styles, "Borderless", ["border-opacity"]),
    ).toStrictEqual({ "border-opacity": "0" });
  });

  it("draws dotted lines as short dashes", () => {
    withEdgeType("KNOWS", { lineStyle: "dotted" });

    const { result } = renderStyles();

    expect(
      styleOfEdge(getStyles(result), "KNOWS", [
        "line-style",
        "line-dash-pattern",
      ]),
    ).toStrictEqual({ "line-style": "dashed", "line-dash-pattern": "1 2" });
  });

  it("draws dashed lines with long dashes", () => {
    withEdgeType("KNOWS", { lineStyle: "dashed" });

    const { result } = renderStyles();

    expect(
      styleOfEdge(getStyles(result), "KNOWS", [
        "line-style",
        "line-dash-pattern",
      ]),
    ).toStrictEqual({ "line-style": "dashed", "line-dash-pattern": "5 6" });
  });

  it("draws solid lines", () => {
    withEdgeType("KNOWS", { lineStyle: "solid" });

    const { result } = renderStyles();

    expect(
      styleOfEdge(getStyles(result), "KNOWS", ["line-style"]),
    ).toStrictEqual({ "line-style": "solid" });
  });

  it("picks label text color from the label background", () => {
    withEdgeType("DARK", { labelColor: "#17457b" });
    withEdgeType("LIGHT", { labelColor: "#ffffff" });

    const { result } = renderStyles();
    const styles = getStyles(result);

    expect(styleOfEdge(styles, "DARK", ["color"])).toStrictEqual({
      color: "rgb(255,255,255)",
    });
    expect(styleOfEdge(styles, "LIGHT", ["color"])).toStrictEqual({
      color: "rgb(0,0,0)",
    });
  });

  it("shows no image for a vertex type without an icon", () => {
    withVertexType("Person", { iconUrl: "" });

    const { result } = renderStyles();

    expect(
      styleOfVertex(getStyles(result), "Person", ["background-image"]),
    ).toStrictEqual({ "background-image": "none" });
  });

  it("styles each of several types by its own config", () => {
    withVertexType("Person", { color: "#0000ff" });
    withVertexType("Company", { color: "#ff0000" });
    withEdgeType("KNOWS", { lineColor: "#ffff00" });
    withEdgeType("WORKS_AT", { lineColor: "#00ff00" });

    const { result } = renderStyles();
    const cy = createHeadlessGraph(getStyles(result), [
      vertexElement(SOURCE_ID, "Person"),
      vertexElement(TARGET_ID, "Company"),
      edgeElement("knows", "KNOWS", "knows"),
      edgeElement("works-at", "WORKS_AT", "works at"),
    ]);

    expect(
      [SOURCE_ID, TARGET_ID].map(id =>
        resolvedStyle(cy.getElementById(id), ["background-color"]),
      ),
    ).toStrictEqual([
      { "background-color": "rgb(0,0,255)" },
      { "background-color": "rgb(255,0,0)" },
    ]);
    expect(
      ["knows", "works-at"].map(id =>
        resolvedStyle(cy.getElementById(id), ["line-color"]),
      ),
    ).toStrictEqual([
      { "line-color": "rgb(255,255,0)" },
      { "line-color": "rgb(0,255,0)" },
    ]);
  });

  it("styles types whose names contain selector characters", () => {
    const vertexType = String.raw`Person "VIP"] \ x`;
    const edgeType = String.raw`KNOWS "well"] \ y`;
    withVertexType(vertexType, { color: "#0000ff" });
    withVertexType("Plain", { color: "#ff0000" });
    withEdgeType(edgeType, { lineColor: "#ffff00" });
    const warn = vi.spyOn(console, "warn");

    const { result } = renderStyles();
    const styles = getStyles(result);

    expect(
      styleOfVertex(styles, vertexType, ["background-color"]),
    ).toStrictEqual({ "background-color": "rgb(0,0,255)" });
    expect(styleOfVertex(styles, "Plain", ["background-color"])).toStrictEqual({
      "background-color": "rgb(255,0,0)",
    });
    expect(styleOfEdge(styles, edgeType, ["line-color"])).toStrictEqual({
      "line-color": "rgb(255,255,0)",
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it("falls back to the default style for a type not in the schema", () => {
    const { result } = renderStyles();
    const styles = getStyles(result);

    expect(
      styleOfVertex(styles, "Unknown", [
        "background-color",
        "background-opacity",
        "background-image",
        "shape",
      ]),
    ).toStrictEqual({
      "background-color": "rgb(18,142,229)",
      "background-opacity": "0.4",
      "background-image": "none",
      shape: "ellipse",
    });
    expect(
      styleOfEdge(styles, "UNKNOWN", [
        "line-color",
        "width",
        "target-arrow-shape",
        "color",
      ]),
    ).toStrictEqual({
      "line-color": "rgb(179,179,179)",
      width: "2px",
      "target-arrow-shape": "triangle",
      color: "rgb(255,255,255)",
    });
  });

  it("restyles elements when a type's config changes", async () => {
    withVertexType("Person", { color: "#ff0000" });

    const { result } = renderStyles();
    expect(
      styleOfVertex(getStyles(result), "Person", ["background-color"]),
    ).toStrictEqual({ "background-color": "rgb(255,0,0)" });

    act(() => {
      const person = createVertexType("Person");
      getAppStore().set(
        userVertexStylesAtom,
        new Map([[person, { type: person, color: "#00ff00" }]]),
      );
    });

    await waitFor(() => {
      expect(
        styleOfVertex(getStyles(result), "Person", ["background-color"]),
      ).toStrictEqual({ "background-color": "rgb(0,255,0)" });
    });
  });

  it("falls back to defaults for style fields stored as undefined", () => {
    withEdgeType("MINIMAL", {
      labelBackgroundOpacity: undefined,
      labelBorderWidth: undefined,
      labelColor: undefined,
    });
    const warn = vi.spyOn(console, "warn");

    const { result } = renderStyles();

    expect(
      styleOfEdge(getStyles(result), "MINIMAL", [
        "text-background-opacity",
        "text-background-color",
        "text-border-width",
      ]),
    ).toStrictEqual({
      "text-background-opacity": "0.7",
      "text-background-color": "rgb(23,69,123)",
      "text-border-width": "0px",
    });
    expect(warn).not.toHaveBeenCalled();
  });
});
