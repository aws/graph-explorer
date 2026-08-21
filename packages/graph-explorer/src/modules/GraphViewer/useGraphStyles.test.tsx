// @vitest-environment happy-dom
import { act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type { GraphProps } from "@/components/Graph";

import {
  type AppStore,
  createVertex,
  createEdgeType,
  createVertexType,
  nodesAtom,
  toNodeMap,
  userVertexStylesAtom,
} from "@/core";
import {
  createRandomEdgeTypeConfig,
  createRandomVertexTypeConfig,
  DbState,
  renderHookWithJotai,
  renderHookWithState,
} from "@/utils/testing";

import useGraphStyles, { useAllRenderedVertexStyles } from "./useGraphStyles";

// A raster icon resolves synchronously to its url, so this test can exercise
// the real icon pipeline and still pin the expected background image.
const RASTER_ICON = {
  iconUrl: "https://example.test/icon.png",
  iconImageType: "image/png",
} as const;

describe("useGraphStyles", () => {
  let dbState: DbState;

  // Helper function to safely access result.current
  const getStyles = (result: { current: GraphProps["styles"] | undefined }) => {
    if (!result.current) {
      throw new Error("result.current is undefined");
    }
    return result.current;
  };

  beforeEach(() => {
    dbState = new DbState();
  });

  it("should generate vertex styles correctly", async () => {
    const vertexConfig = {
      ...createRandomVertexTypeConfig(),
      ...RASTER_ICON,
      type: createVertexType("Person"),
      color: "#128EE5",
      backgroundOpacity: 0.8,
      borderColor: "#000000",
      borderWidth: 2,
      borderStyle: "solid" as const,
      shape: "ellipse" as const,
    };
    dbState.activeSchema.vertices = [vertexConfig];
    dbState.addVertexStyle(vertexConfig.type, vertexConfig);

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    await waitFor(() => {
      const vertexStyle = getStyles(result)[`node[type="Person"]`] as any;
      expect(vertexStyle).toEqual({
        "background-image": RASTER_ICON.iconUrl,
        "background-color": "#128EE5",
        "background-opacity": 0.8,
        "border-color": "#000000",
        "border-width": 2,
        "border-opacity": 1,
        "border-style": "solid",
        shape: "ellipse",
        width: 24,
        height: 24,
      });
    });
  });

  it("should generate edge styles correctly", () => {
    const edgeConfig = {
      ...createRandomEdgeTypeConfig(),
      type: createEdgeType("KNOWS"),
      labelColor: "#17457b",
      lineColor: "#b3b3b3",
      lineStyle: "solid" as const,
      lineThickness: 2,
      sourceArrowStyle: "none" as const,
      targetArrowStyle: "triangle" as const,
      labelBackgroundOpacity: 0.8,
      labelBorderWidth: 1,
      labelBorderColor: "#000000",
      labelBorderStyle: "solid" as const,
    };
    dbState.activeSchema.edges = [edgeConfig];
    dbState.addEdgeStyle(edgeConfig.type, edgeConfig);

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    const edgeStyle = getStyles(result)[`edge[type="KNOWS"]`] as any;
    expect(edgeStyle).toMatchObject({
      color: "#FFFFFF", // White text for dark background
      "line-color": "#b3b3b3",
      "line-style": "solid",
      "line-dash-pattern": undefined,
      "source-arrow-shape": "none",
      "source-arrow-color": "#b3b3b3",
      "target-arrow-shape": "triangle",
      "target-arrow-color": "#b3b3b3",
      "text-background-opacity": 0.8,
      "text-background-color": "#17457b",
      "text-border-width": 1,
      "text-border-color": "#000000",
      "text-border-style": "solid",
      width: 2,
      "source-distance-from-node": 0,
      "target-distance-from-node": 0,
    });
  });

  it("should set border-opacity to 1 when border width is non-zero", () => {
    const vertexConfig = {
      ...createRandomVertexTypeConfig(),
      type: createVertexType("Person"),
      borderWidth: 3,
    };
    dbState.activeSchema.vertices = [vertexConfig];
    dbState.addVertexStyle(vertexConfig.type, vertexConfig);

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    const vertexStyle = getStyles(result)[`node[type="Person"]`] as any;
    expect(vertexStyle["border-opacity"]).toBe(1);
  });

  it("should set border-opacity to 0 when border width is zero", () => {
    const vertexConfig = {
      ...createRandomVertexTypeConfig(),
      type: createVertexType("Person"),
      borderWidth: 0,
    };
    dbState.activeSchema.vertices = [vertexConfig];
    dbState.addVertexStyle(vertexConfig.type, vertexConfig);

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    const vertexStyle = getStyles(result)[`node[type="Person"]`] as any;
    expect(vertexStyle["border-width"]).toBe(0);
    expect(vertexStyle["border-opacity"]).toBe(0);
  });

  it("should handle edge config with dotted line style", () => {
    const edgeConfig = {
      ...createRandomEdgeTypeConfig(),
      type: createEdgeType("KNOWS"),
      lineStyle: "dotted" as const,
    };
    dbState.activeSchema.edges = [edgeConfig];
    dbState.addEdgeStyle(edgeConfig.type, edgeConfig);

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    const edgeStyle = getStyles(result)[`edge[type="KNOWS"]`] as any;
    expect(edgeStyle["line-style"]).toBe("dashed");
    expect(edgeStyle["line-dash-pattern"]).toEqual([1, 2]);
  });

  it("should handle edge config with dashed line style", () => {
    const edgeConfig = {
      ...createRandomEdgeTypeConfig(),
      type: createEdgeType("KNOWS"),
      lineStyle: "dashed" as const,
    };
    dbState.activeSchema.edges = [edgeConfig];
    dbState.addEdgeStyle(edgeConfig.type, edgeConfig);

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    const edgeStyle = getStyles(result)[`edge[type="KNOWS"]`] as any;
    expect(edgeStyle["line-style"]).toBe("dashed");
    expect(edgeStyle["line-dash-pattern"]).toEqual([5, 6]);
  });

  it("should use light text color for light label background", () => {
    const edgeConfig = {
      ...createRandomEdgeTypeConfig(),
      type: createEdgeType("KNOWS"),
      labelColor: "#ffffff",
    };
    dbState.activeSchema.edges = [edgeConfig];
    dbState.addEdgeStyle(edgeConfig.type, edgeConfig);

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    const edgeStyle = getStyles(result)[`edge[type="KNOWS"]`] as any;
    expect(edgeStyle.color).toBe("#000000"); // Black text for light background
  });

  it("should handle text transformation for edge labels", () => {
    const edgeConfig = createRandomEdgeTypeConfig();
    dbState.activeSchema.edges = [edgeConfig];
    dbState.addEdgeStyle(edgeConfig.type, edgeConfig);

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    // The hook should work with the text transform functionality
    // This test verifies the integration works properly
    expect(getStyles(result)[`edge[type="${edgeConfig.type}"]`]).toBeDefined();
  });

  it("should truncate long edge labels", () => {
    const longEdgeType = createEdgeType(
      "VERY_LONG_EDGE_TYPE_NAME_THAT_EXCEEDS_LIMIT",
    );
    const edgeConfig = {
      ...createRandomEdgeTypeConfig(),
      type: longEdgeType,
    };
    dbState.activeSchema.edges = [edgeConfig];
    dbState.addEdgeStyle(edgeConfig.type, edgeConfig);

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    // The label function should be defined, but we can't easily test the truncation
    // without mocking the text transform function more specifically
    const edgeStyle = getStyles(result)[`edge[type="${longEdgeType}"]`] as any;
    expect(edgeStyle.label).toBeDefined();
  });

  it("should have label use the display name in the data", () => {
    const edgeConfig = {
      ...createRandomEdgeTypeConfig(),
      type: createEdgeType("KNOWS"),
    };
    dbState.activeSchema.edges = [edgeConfig];
    dbState.addEdgeStyle(edgeConfig.type, edgeConfig);

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    const edgeStyle = getStyles(result)[`edge[type="KNOWS"]`] as any;
    expect(edgeStyle.label).toEqual("data(displayName)");
  });

  it("omits the background image when the vertex type has no icon", () => {
    const vertexConfig = {
      ...createRandomVertexTypeConfig(),
      type: createVertexType("Person"),
      iconUrl: "",
    };
    dbState.activeSchema.vertices = [vertexConfig];
    dbState.addVertexStyle(vertexConfig.type, vertexConfig);

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    const vertexStyle = getStyles(result)[`node[type="Person"]`] as any;
    expect(vertexStyle["background-image"]).toBeUndefined();
  });

  it("should handle multiple vertex and edge types", () => {
    const personConfig = {
      ...createRandomVertexTypeConfig(),
      type: createVertexType("Person"),
    };
    const companyConfig = {
      ...createRandomVertexTypeConfig(),
      type: createVertexType("Company"),
      color: "#ff0000",
    };

    const knowsConfig = createRandomEdgeTypeConfig();
    const worksAtConfig = {
      ...createRandomEdgeTypeConfig(),
      type: createEdgeType("WORKS_AT"),
      lineColor: "#00ff00",
    };

    dbState.activeSchema.vertices = [personConfig, companyConfig];
    dbState.activeSchema.edges = [knowsConfig, worksAtConfig];
    dbState.addVertexStyle(personConfig.type, personConfig);
    dbState.addVertexStyle(companyConfig.type, companyConfig);
    dbState.addEdgeStyle(knowsConfig.type, knowsConfig);
    dbState.addEdgeStyle(worksAtConfig.type, worksAtConfig);

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    expect(
      (getStyles(result)[`node[type="Company"]`] as any)["background-color"],
    ).toBe("#ff0000");
    expect(
      (getStyles(result)[`edge[type="WORKS_AT"]`] as any)["line-color"],
    ).toBe("#00ff00");
  });

  it("should update styles when configs change", () => {
    const vertexConfig = {
      ...createRandomVertexTypeConfig(),
      type: createVertexType("Person"),
      color: "#ff0000",
    };
    const edgeConfig = createRandomEdgeTypeConfig();

    const updatedDbState = new DbState();
    updatedDbState.activeSchema.vertices = [vertexConfig];
    updatedDbState.activeSchema.edges = [edgeConfig];
    updatedDbState.addVertexStyle(vertexConfig.type, vertexConfig);
    dbState.addEdgeStyle(edgeConfig.type, edgeConfig);

    const { result } = renderHookWithState(
      () => useGraphStyles(),
      updatedDbState,
    );

    expect(
      (getStyles(result)[`node[type="Person"]`] as any)["background-color"],
    ).toBe("#ff0000");
  });

  it("should handle edge config with undefined optional properties", () => {
    const minimalEdgeConfig = {
      ...createRandomEdgeTypeConfig(),
      type: createEdgeType("MINIMAL"),
      // Remove optional properties to test undefined handling
      labelBackgroundOpacity: undefined,
      labelBorderWidth: undefined,
      labelColor: undefined,
    };

    dbState.activeSchema.edges = [minimalEdgeConfig];
    dbState.addEdgeStyle(minimalEdgeConfig.type, minimalEdgeConfig);

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    const edgeStyle = getStyles(result)[`edge[type="MINIMAL"]`] as any;
    expect(edgeStyle["text-background-opacity"]).toBeUndefined();
    expect(edgeStyle["text-background-color"]).toBeUndefined();
    expect(edgeStyle["text-border-width"]).toBeUndefined();
  });

  it("should use deferred values for performance", () => {
    const vertexConfig = createRandomVertexTypeConfig();
    const edgeConfig = createRandomEdgeTypeConfig();

    dbState.activeSchema.vertices = [vertexConfig];
    dbState.activeSchema.edges = [edgeConfig];
    dbState.addVertexStyle(vertexConfig.type, vertexConfig);
    dbState.addEdgeStyle(edgeConfig.type, edgeConfig);

    // This test ensures that the hook uses useDeferredValue for configs
    // The actual deferring behavior is handled by React, so we just verify
    // that the hook works with the provided configs
    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    // Verify that the hook successfully processes the configurations
    expect(
      getStyles(result)[`node[type="${vertexConfig.type}"]`],
    ).toBeDefined();
    expect(getStyles(result)[`edge[type="${edgeConfig.type}"]`]).toBeDefined();
  });

  // Regression test for a real infinite render loop this hook caused in
  // manual testing (multi-typed vertex + a fresh mount/session restore).
  //
  // Root cause: `useAllRenderedVertexStyles` used to source its vertex list
  // via `useDisplayVerticesInCanvas()`, whose underlying selector
  // (`displayVerticesInCanvasSelector`) allocates a brand-new array/Map on
  // every single read (`get(nodesAtom).values().toArray()` feeding a
  // reference-keyed atomFamily), even when `nodesAtom` itself hasn't changed.
  // The hook's `useMemo` therefore never actually memoized, so every render
  // produced a "new" config array by identity — which, chained through
  // `useGraphStyles`'s `useDeferredValue`, never converged and pegged the CPU
  // in a real browser tab. The fix reads `nodesAtom` directly instead, which
  // Jotai only changes identity for when it's actually written to.
  //
  // This is asserted directly on the memoized value's referential stability,
  // not via a render-count/timing probe: an isolated `renderHook` test of
  // `useGraphStyles` alone did not reproduce the actual hang even on the
  // unfixed code — the real feedback loop needs the mounted `<Graph>`
  // component's Cytoscape-sync effects (which aren't exercised here) to close
  // the cycle. Referential stability of the memoized array is the precise,
  // deterministic property whose violation caused the bug, and is what any
  // future change here must preserve regardless of how it's wired downstream.
  it("returns the same array reference across re-renders when nothing changed", () => {
    const typeA = createVertexType("TypeA");
    const typeB = createVertexType("TypeB");
    dbState.addVertexStyle(typeA, { color: "red" });
    dbState.addVertexStyle(typeB, { borderColor: "blue" });
    dbState.addVertexToGraph(createVertex({ id: "v1", types: [typeA, typeB] }));

    const { result, rerender } = renderHookWithState(
      () => useAllRenderedVertexStyles(),
      dbState,
    );

    const firstRender = result.current;
    expect(firstRender.length).toBe(1);

    act(() => rerender());

    expect(result.current).toBe(firstRender);
  });

  // A stronger version of the regression above, closer to the actual reported
  // scenario: a session restore adds vertices one at a time (a fresh
  // `nodesAtom` identity per vertex), most of them reusing a type combination
  // already on the canvas. If this hook rebuilds its array on every one of
  // those adds — not just when the *set of distinct combinations* changes —
  // it forces a full Cytoscape stylesheet rebuild per vertex, which for a
  // large restored graph is what actually produced the reported hang (not a
  // literal non-terminating loop, but indistinguishable from one).
  it("does not rebuild the resolved styles when a new vertex reuses an existing type combination", () => {
    const typeA = createVertexType("TypeA");
    let store!: AppStore;

    const { result } = renderHookWithJotai(
      () => useAllRenderedVertexStyles(),
      s => {
        store = s;
        store.set(
          userVertexStylesAtom,
          new Map([[typeA, { type: typeA, color: "red" }]]),
        );
        store.set(
          nodesAtom,
          toNodeMap([createVertex({ id: "v1", types: [typeA] })]),
        );
      },
    );

    const firstRender = result.current;
    expect(firstRender.length).toBe(1);

    // Simulate the next step of a session restore: one more vertex of the
    // exact same type combination, via a brand-new nodesAtom identity (the
    // same shape as a real incremental restore).
    act(() => {
      store.set(
        nodesAtom,
        toNodeMap([
          createVertex({ id: "v1", types: [typeA] }),
          createVertex({ id: "v2", types: [typeA] }),
        ]),
      );
    });

    expect(result.current).toBe(firstRender);

    // A vertex that introduces a genuinely new combination must still produce
    // a new (correct) result — this isn't just permanently stuck on the first
    // value.
    const typeB = createVertexType("TypeB");
    act(() => {
      store.set(
        nodesAtom,
        toNodeMap([
          createVertex({ id: "v1", types: [typeA] }),
          createVertex({ id: "v3", types: [typeB] }),
        ]),
      );
    });

    expect(result.current).not.toBe(firstRender);
    expect(result.current.length).toBe(2);
  });
});
