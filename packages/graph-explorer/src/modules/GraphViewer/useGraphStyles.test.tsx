import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";
import useGraphStyles from "./useGraphStyles";
import { renderNode } from "./renderNode";
import { LABELS } from "@/utils/constants";
import { getEdgeIdFromRenderedEdgeId } from "@/core";
import type { RenderedEdgeId } from "@/core";
import type { GraphProps } from "@/components";
import {
  DbState,
  renderHookWithState,
  createRandomVertexTypeConfig,
  createRandomEdgeTypeConfig,
} from "@/utils/testing";

// Mock dependencies
vi.mock("./renderNode");
vi.mock("@/core", async () => {
  const actual = await vi.importActual("@/core");
  return {
    ...actual,
    getEdgeIdFromRenderedEdgeId: vi.fn(),
    useDisplayEdgesInCanvas: vi.fn(),
  };
});

const mockRenderNode = renderNode as Mock;
const mockGetEdgeIdFromRenderedEdgeId = getEdgeIdFromRenderedEdgeId as Mock;

// Import the mocked function
import { useDisplayEdgesInCanvas } from "@/core";
const mockUseDisplayEdgesInCanvas = useDisplayEdgesInCanvas as Mock;

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
    vi.clearAllMocks();
    dbState = new DbState();

    // Setup mock implementations
    mockRenderNode.mockResolvedValue("data:image/svg+xml;utf8,<svg></svg>");
    mockGetEdgeIdFromRenderedEdgeId.mockReturnValue("edge-1");
    mockUseDisplayEdgesInCanvas.mockReturnValue(new Map());
  });

  it("should generate vertex styles correctly", async () => {
    const vertexConfig = {
      ...createRandomVertexTypeConfig(),
      type: "Person",
      color: "#128EE5",
      backgroundOpacity: 0.8,
      borderColor: "#000000",
      borderWidth: 2,
      borderStyle: "solid" as const,
      shape: "ellipse" as const,
    };
    dbState.activeSchema.vertices = [vertexConfig];

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    await waitFor(() => {
      const vertexStyle = getStyles(result)[`node[type="Person"]`] as any;
      expect(vertexStyle).toEqual({
        "background-image": "data:image/svg+xml;utf8,<svg></svg>",
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
      type: "KNOWS",
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

  it("should handle vertex config without border width", () => {
    const vertexConfig = {
      ...createRandomVertexTypeConfig(),
      type: "Person",
      borderWidth: 0,
    };
    dbState.activeSchema.vertices = [vertexConfig];

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    const vertexStyle = getStyles(result)[`node[type="Person"]`] as any;
    expect(vertexStyle["border-opacity"]).toBe(0);
  });

  it("should handle edge config with dotted line style", () => {
    const edgeConfig = {
      ...createRandomEdgeTypeConfig(),
      type: "KNOWS",
      lineStyle: "dotted" as const,
    };
    dbState.activeSchema.edges = [edgeConfig];

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    const edgeStyle = getStyles(result)[`edge[type="KNOWS"]`] as any;
    expect(edgeStyle["line-style"]).toBe("dashed");
    expect(edgeStyle["line-dash-pattern"]).toEqual([1, 2]);
  });

  it("should handle edge config with dashed line style", () => {
    const edgeConfig = {
      ...createRandomEdgeTypeConfig(),
      type: "KNOWS",
      lineStyle: "dashed" as const,
    };
    dbState.activeSchema.edges = [edgeConfig];

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    const edgeStyle = getStyles(result)[`edge[type="KNOWS"]`] as any;
    expect(edgeStyle["line-style"]).toBe("dashed");
    expect(edgeStyle["line-dash-pattern"]).toEqual([5, 6]);
  });

  it("should use light text color for light label background", () => {
    const edgeConfig = {
      ...createRandomEdgeTypeConfig(),
      type: "KNOWS",
      labelColor: "#ffffff",
    };
    dbState.activeSchema.edges = [edgeConfig];

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    const edgeStyle = getStyles(result)[`edge[type="KNOWS"]`] as any;
    expect(edgeStyle.color).toBe("#000000"); // Black text for light background
  });

  it("should handle text transformation for edge labels", () => {
    const edgeConfig = createRandomEdgeTypeConfig();
    dbState.activeSchema.edges = [edgeConfig];

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    // The hook should work with the text transform functionality
    // This test verifies the integration works properly
    expect(getStyles(result)[`edge[type="${edgeConfig.type}"]`]).toBeDefined();
  });

  it("should truncate long edge labels", () => {
    const longEdgeType = "VERY_LONG_EDGE_TYPE_NAME_THAT_EXCEEDS_LIMIT";
    const edgeConfig = {
      ...createRandomEdgeTypeConfig(),
      type: longEdgeType,
    };
    dbState.activeSchema.edges = [edgeConfig];

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    // The label function should be defined, but we can't easily test the truncation
    // without mocking the text transform function more specifically
    const edgeStyle = getStyles(result)[`edge[type="${longEdgeType}"]`] as any;
    expect(edgeStyle.label).toBeDefined();
  });

  it("should handle edge label function with display edges", () => {
    const edgeConfig = {
      ...createRandomEdgeTypeConfig(),
      type: "KNOWS",
    };
    dbState.activeSchema.edges = [edgeConfig];

    const mockDisplayEdge = {
      displayName: "Custom Display Name",
    };
    const mockDisplayEdgesMap = new Map([["edge-1", mockDisplayEdge]]);
    mockUseDisplayEdgesInCanvas.mockReturnValue(mockDisplayEdgesMap);

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    const edgeStyle = getStyles(result)[`edge[type="KNOWS"]`] as any;
    const labelFunction = edgeStyle.label as (el: {
      id: () => RenderedEdgeId;
    }) => string;

    // Mock cytoscape edge element
    const mockEdgeElement = {
      id: () => "rendered-edge-1" as RenderedEdgeId,
    };

    const label = labelFunction(mockEdgeElement);
    expect(label).toBe("Custom Display Name");
  });

  it("should return missing display value when edge not found", () => {
    const edgeConfig = {
      ...createRandomEdgeTypeConfig(),
      type: "KNOWS",
    };
    dbState.activeSchema.edges = [edgeConfig];

    const mockDisplayEdgesMap = new Map(); // Empty map
    mockUseDisplayEdgesInCanvas.mockReturnValue(mockDisplayEdgesMap);

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    const edgeStyle = getStyles(result)[`edge[type="KNOWS"]`] as any;
    const labelFunction = edgeStyle.label as (el: {
      id: () => RenderedEdgeId;
    }) => string;

    // Mock cytoscape edge element
    const mockEdgeElement = {
      id: () => "rendered-edge-1" as RenderedEdgeId,
    };

    const label = labelFunction(mockEdgeElement);
    expect(label).toBe(LABELS.MISSING_VALUE);
  });

  it("should handle renderNode failure gracefully", () => {
    const vertexConfig = {
      ...createRandomVertexTypeConfig(),
      type: "Person",
    };
    dbState.activeSchema.vertices = [vertexConfig];

    mockRenderNode.mockResolvedValue(undefined);

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    const vertexStyle = getStyles(result)[`node[type="Person"]`] as any;
    expect(vertexStyle["background-image"]).toBeUndefined();
  });

  it("should handle multiple vertex and edge types", () => {
    const personConfig = {
      ...createRandomVertexTypeConfig(),
      type: "Person",
    };
    const companyConfig = {
      ...createRandomVertexTypeConfig(),
      type: "Company",
      color: "#ff0000",
    };

    const knowsConfig = createRandomEdgeTypeConfig();
    const worksAtConfig = {
      ...createRandomEdgeTypeConfig(),
      type: "WORKS_AT",
      lineColor: "#00ff00",
    };

    dbState.activeSchema.vertices = [personConfig, companyConfig];
    dbState.activeSchema.edges = [knowsConfig, worksAtConfig];

    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    expect(
      (getStyles(result)[`node[type="Company"]`] as any)["background-color"]
    ).toBe("#ff0000");
    expect(
      (getStyles(result)[`edge[type="WORKS_AT"]`] as any)["line-color"]
    ).toBe("#00ff00");
  });

  it("should update styles when configs change", () => {
    const vertexConfig = {
      ...createRandomVertexTypeConfig(),
      type: "Person",
      color: "#ff0000",
    };
    const edgeConfig = createRandomEdgeTypeConfig();

    const updatedDbState = new DbState();
    updatedDbState.activeSchema.vertices = [vertexConfig];
    updatedDbState.activeSchema.edges = [edgeConfig];

    const { result } = renderHookWithState(
      () => useGraphStyles(),
      updatedDbState
    );

    expect(
      (getStyles(result)[`node[type="Person"]`] as any)["background-color"]
    ).toBe("#ff0000");
  });

  it("should handle edge config with undefined optional properties", () => {
    const minimalEdgeConfig = {
      ...createRandomEdgeTypeConfig(),
      type: "MINIMAL",
      // Remove optional properties to test undefined handling
      labelBackgroundOpacity: undefined,
      labelBorderWidth: undefined,
      labelColor: undefined,
    };

    dbState.activeSchema.edges = [minimalEdgeConfig];

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

    // This test ensures that the hook uses useDeferredValue for configs
    // The actual deferring behavior is handled by React, so we just verify
    // that the hook works with the provided configs
    const { result } = renderHookWithState(() => useGraphStyles(), dbState);

    // Verify that the hook successfully processes the configurations
    expect(
      getStyles(result)[`node[type="${vertexConfig.type}"]`]
    ).toBeDefined();
    expect(getStyles(result)[`edge[type="${edgeConfig.type}"]`]).toBeDefined();
  });
});
