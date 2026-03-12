import { act } from "react";

import { createEdgeType, createVertexType } from "@/core";
import { DbState, renderHookWithState } from "@/utils/testing";

import {
  defaultEdgePreferences,
  defaultVertexPreferences,
  type EdgePreferencesStorageModel,
  mergeDefaultsIntoUserStyling,
  useEdgeStyling,
  useVertexStyling,
  type VertexPreferencesStorageModel,
} from "./userPreferences";

function createExpectedVertex(existing: VertexPreferencesStorageModel) {
  return {
    ...defaultVertexPreferences,
    ...existing,
  };
}

function createExpectedEdge(existing: EdgePreferencesStorageModel) {
  return {
    ...defaultEdgePreferences,
    ...existing,
  };
}

describe("useVertexStyling", () => {
  it("should return defaults when the style does not exist", () => {
    const dbState = new DbState();
    const { result } = renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );
    const expected = createExpectedVertex({ type: createVertexType("test") });

    expect(result.current.vertexStyle).toStrictEqual(expected);
  });

  it("should return the vertex style when it exists", () => {
    const dbState = new DbState();
    const style = dbState.addVertexStyle(createVertexType("test"), {
      color: "red",
    });
    const expected = createExpectedVertex(style);

    const { result } = renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );

    expect(result.current.vertexStyle).toStrictEqual(expected);
  });

  it("should insert the vertex style when none exist", () => {
    const dbState = new DbState();
    const { result } = renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );

    act(() => result.current.setVertexStyle({ color: "red" }));

    expect(result.current.vertexStyle).toStrictEqual(
      createExpectedVertex({ type: createVertexType("test"), color: "red" }),
    );
  });

  it("should update the existing style, merging new styles", () => {
    const dbState = new DbState();
    const { result } = renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );

    act(() =>
      result.current.setVertexStyle({ color: "red", borderColor: "green" }),
    );
    act(() => result.current.setVertexStyle({ borderColor: "blue" }));

    expect(result.current.vertexStyle).toStrictEqual(
      createExpectedVertex({
        type: createVertexType("test"),
        color: "red",
        borderColor: "blue",
      }),
    );
  });

  it("should reset the vertex style", () => {
    const dbState = new DbState();
    dbState.addVertexStyle(createVertexType("test"), { borderColor: "blue" });

    const { result } = renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );

    act(() => result.current.resetVertexStyle());

    expect(result.current.vertexStyle).toStrictEqual(
      createExpectedVertex({ type: createVertexType("test") }),
    );
  });

  it("should not affect other vertex styles when updating", () => {
    const dbState = new DbState();
    dbState.addVertexStyle(createVertexType("type1"), { color: "red" });
    dbState.addVertexStyle(createVertexType("type2"), { color: "blue" });

    const { result } = renderHookWithState(
      () => useVertexStyling(createVertexType("type1")),
      dbState,
    );

    act(() => result.current.setVertexStyle({ borderColor: "green" }));

    // Check that type1 was updated
    expect(result.current.vertexStyle).toStrictEqual(
      createExpectedVertex({
        type: createVertexType("type1"),
        color: "red",
        borderColor: "green",
      }),
    );

    // Check that type2 was not affected by getting its hook
    const { result: result2 } = renderHookWithState(
      () => useVertexStyling(createVertexType("type2")),
      dbState,
    );
    expect(result2.current.vertexStyle).toStrictEqual(
      createExpectedVertex({
        type: createVertexType("type2"),
        color: "blue",
      }),
    );
  });

  it("should not affect other vertex styles when resetting", () => {
    const dbState = new DbState();
    dbState.addVertexStyle(createVertexType("type1"), { color: "red" });
    dbState.addVertexStyle(createVertexType("type2"), { color: "blue" });

    const { result } = renderHookWithState(
      () => useVertexStyling(createVertexType("type1")),
      dbState,
    );

    act(() => result.current.resetVertexStyle());

    expect(result.current.vertexStyle).toStrictEqual(
      createExpectedVertex({ type: createVertexType("type1") }),
    );

    // Check that type2 still exists
    const { result: result2 } = renderHookWithState(
      () => useVertexStyling(createVertexType("type2")),
      dbState,
    );
    expect(result2.current.vertexStyle).toStrictEqual(
      createExpectedVertex({
        type: createVertexType("type2"),
        color: "blue",
      }),
    );
  });

  it("should handle empty style updates", () => {
    const dbState = new DbState();
    const { result } = renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );

    act(() => result.current.setVertexStyle({}));

    expect(result.current.vertexStyle).toStrictEqual(
      createExpectedVertex({ type: createVertexType("test") }),
    );
  });
});

describe("useEdgeStyling", () => {
  it("should return defaults when the style does not exist", () => {
    const dbState = new DbState();
    const { result } = renderHookWithState(
      () => useEdgeStyling(createEdgeType("test")),
      dbState,
    );

    expect(result.current.edgeStyle).toStrictEqual(
      createExpectedEdge({ type: createEdgeType("test") }),
    );
  });

  it("should return the edge style when it exists", () => {
    const dbState = new DbState();
    const style = dbState.addEdgeStyle(createEdgeType("test"), {
      lineColor: "red",
    });
    const { result } = renderHookWithState(
      () => useEdgeStyling(createEdgeType("test")),
      dbState,
    );

    expect(result.current.edgeStyle).toStrictEqual(createExpectedEdge(style));
  });

  it("should insert the edge style when none exist", () => {
    const dbState = new DbState();
    const { result } = renderHookWithState(
      () => useEdgeStyling(createEdgeType("test")),
      dbState,
    );

    act(() => result.current.setEdgeStyle({ lineColor: "red" }));

    expect(result.current.edgeStyle).toStrictEqual(
      createExpectedEdge({
        type: createEdgeType("test"),
        lineColor: "red",
      }),
    );
  });

  it("should update the existing style, merging new styles", () => {
    const dbState = new DbState();
    const { result } = renderHookWithState(
      () => useEdgeStyling(createEdgeType("test")),
      dbState,
    );

    act(() =>
      result.current.setEdgeStyle({ lineColor: "red", labelColor: "green" }),
    );
    act(() => result.current.setEdgeStyle({ labelColor: "blue" }));

    expect(result.current.edgeStyle).toStrictEqual(
      createExpectedEdge({
        type: createEdgeType("test"),
        lineColor: "red",
        labelColor: "blue",
      }),
    );
  });

  it("should reset the edge style", () => {
    const dbState = new DbState();
    const { result } = renderHookWithState(
      () => useEdgeStyling(createEdgeType("test")),
      dbState,
    );

    act(() => result.current.setEdgeStyle({ labelColor: "blue" }));
    act(() => result.current.resetEdgeStyle());

    expect(result.current.edgeStyle).toStrictEqual(
      createExpectedEdge({ type: createEdgeType("test") }),
    );
  });

  it("should not affect other edge styles when updating", () => {
    const dbState = new DbState();
    dbState.addEdgeStyle(createEdgeType("type1"), { lineColor: "red" });
    dbState.addEdgeStyle(createEdgeType("type2"), { lineColor: "blue" });

    const { result } = renderHookWithState(
      () => useEdgeStyling(createEdgeType("type1")),
      dbState,
    );

    act(() => result.current.setEdgeStyle({ labelColor: "green" }));

    // Check that type1 was updated
    expect(result.current.edgeStyle).toStrictEqual(
      createExpectedEdge({
        type: createEdgeType("type1"),
        lineColor: "red",
        labelColor: "green",
      }),
    );

    // Check that type2 was not affected
    const { result: result2 } = renderHookWithState(
      () => useEdgeStyling(createEdgeType("type2")),
      dbState,
    );
    expect(result2.current.edgeStyle).toStrictEqual(
      createExpectedEdge({
        type: createEdgeType("type2"),
        lineColor: "blue",
      }),
    );
  });

  it("should not affect other edge styles when resetting", () => {
    const dbState = new DbState();
    dbState.addEdgeStyle(createEdgeType("type1"), { lineColor: "red" });
    dbState.addEdgeStyle(createEdgeType("type2"), { lineColor: "blue" });

    const { result } = renderHookWithState(
      () => useEdgeStyling(createEdgeType("type1")),
      dbState,
    );

    act(() => result.current.resetEdgeStyle());

    expect(result.current.edgeStyle).toStrictEqual(
      createExpectedEdge({ type: createEdgeType("type1") }),
    );

    // Check that type2 still exists
    const { result: result2 } = renderHookWithState(
      () => useEdgeStyling(createEdgeType("type2")),
      dbState,
    );
    expect(result2.current.edgeStyle).toStrictEqual(
      createExpectedEdge({
        type: createEdgeType("type2"),
        lineColor: "blue",
      }),
    );
  });

  it("should handle empty style updates", () => {
    const dbState = new DbState();
    const { result } = renderHookWithState(
      () => useEdgeStyling(createEdgeType("test")),
      dbState,
    );

    act(() => result.current.setEdgeStyle({}));

    expect(result.current.edgeStyle).toStrictEqual(
      createExpectedEdge({ type: createEdgeType("test") }),
    );
  });
});

describe("default styling", () => {
  it("should apply default styling when no user pref exists", () => {
    const dbState = new DbState();
    dbState.setDefaultStyling({
      vertices: [
        { type: createVertexType("test"), color: "red", shape: "diamond" },
      ],
    });

    const { result } = renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );

    expect(result.current.vertexStyle.color).toBe("red");
    expect(result.current.vertexStyle.shape).toBe("diamond");
  });

  it("should let user prefs override default styling", () => {
    const dbState = new DbState();
    dbState.setDefaultStyling({
      vertices: [
        { type: createVertexType("test"), color: "red", shape: "diamond" },
      ],
    });
    dbState.addVertexStyle(createVertexType("test"), { color: "blue" });

    const { result } = renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );

    // User pref overrides default styling color
    expect(result.current.vertexStyle.color).toBe("blue");
    // Default styling shape still applies since user didn't override it
    expect(result.current.vertexStyle.shape).toBe("diamond");
  });

  it("should reveal default styling after reset", () => {
    const dbState = new DbState();
    dbState.setDefaultStyling({
      vertices: [{ type: createVertexType("test"), color: "red" }],
    });
    dbState.addVertexStyle(createVertexType("test"), { color: "blue" });

    const { result } = renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );

    expect(result.current.vertexStyle.color).toBe("blue");

    act(() => result.current.resetVertexStyle());

    // After reset, default styling color should be visible
    expect(result.current.vertexStyle.color).toBe("red");
  });

  it("should fall through to hardcoded defaults when no default styling", () => {
    const dbState = new DbState();
    // No default styling set

    const { result } = renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );

    expect(result.current.vertexStyle).toStrictEqual(
      createExpectedVertex({ type: createVertexType("test") }),
    );
  });

  it("should apply default edge styling", () => {
    const dbState = new DbState();
    dbState.setDefaultStyling({
      edges: [
        { type: createEdgeType("test"), lineColor: "green", lineThickness: 5 },
      ],
    });

    const { result } = renderHookWithState(
      () => useEdgeStyling(createEdgeType("test")),
      dbState,
    );

    expect(result.current.edgeStyle.lineColor).toBe("green");
    expect(result.current.edgeStyle.lineThickness).toBe(5);
  });

  it("should let user edge prefs override default edge styling", () => {
    const dbState = new DbState();
    dbState.setDefaultStyling({
      edges: [
        { type: createEdgeType("test"), lineColor: "green", lineThickness: 5 },
      ],
    });
    dbState.addEdgeStyle(createEdgeType("test"), { lineColor: "red" });

    const { result } = renderHookWithState(
      () => useEdgeStyling(createEdgeType("test")),
      dbState,
    );

    expect(result.current.edgeStyle.lineColor).toBe("red");
    expect(result.current.edgeStyle.lineThickness).toBe(5);
  });
});

describe("mergeDefaultsIntoUserStyling", () => {
  it("should add default types when user has none", () => {
    const result = mergeDefaultsIntoUserStyling(
      {},
      {
        vertices: [{ type: createVertexType("A"), color: "red" }],
        edges: [{ type: createEdgeType("B"), lineColor: "green" }],
      },
    );
    expect(result.vertices).toHaveLength(1);
    expect(result.vertices![0].color).toBe("red");
    expect(result.edges).toHaveLength(1);
    expect(result.edges![0].lineColor).toBe("green");
  });

  it("should merge properties when user has partial override", () => {
    const result = mergeDefaultsIntoUserStyling(
      {
        vertices: [{ type: createVertexType("A"), color: "blue" }],
      },
      {
        vertices: [
          { type: createVertexType("A"), color: "red", shape: "diamond" },
        ],
      },
    );
    expect(result.vertices).toHaveLength(1);
    expect(result.vertices![0].color).toBe("blue"); // user wins
    expect(result.vertices![0].shape).toBe("diamond"); // default fills in
  });

  it("should not modify types not in defaults", () => {
    const result = mergeDefaultsIntoUserStyling(
      {
        vertices: [{ type: createVertexType("A"), color: "blue" }],
        edges: [{ type: createEdgeType("X"), lineColor: "red" }],
      },
      {
        vertices: [{ type: createVertexType("B"), color: "green" }],
      },
    );
    expect(result.vertices).toHaveLength(2);
    expect(result.vertices![0].color).toBe("blue");
    expect(result.vertices![1].color).toBe("green");
    expect(result.edges).toHaveLength(1);
    expect(result.edges![0].lineColor).toBe("red");
  });

  it("should handle empty defaults", () => {
    const input = {
      vertices: [{ type: createVertexType("A"), color: "blue" }],
    };
    const result = mergeDefaultsIntoUserStyling(input, {});
    expect(result.vertices).toHaveLength(1);
    expect(result.edges).toHaveLength(0);
  });
});

describe("useDeferredAtom integration", () => {
  it("should handle multiple rapid updates correctly", () => {
    const dbState = new DbState();
    const { result } = renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );

    // Simulate rapid updates that might happen in real usage
    act(() => {
      result.current.setVertexStyle({ color: "red" });
      result.current.setVertexStyle({ borderColor: "blue" });
      result.current.setVertexStyle({ shape: "ellipse" });
    });

    expect(result.current.vertexStyle).toStrictEqual(
      createExpectedVertex({
        type: createVertexType("test"),
        color: "red",
        borderColor: "blue",
        shape: "ellipse",
      }),
    );
  });

  it("should handle deferred atom updates correctly", () => {
    const dbState = new DbState();
    const { result } = renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );

    // Test that the deferred atom pattern works with the hook
    act(() => result.current.setVertexStyle({ color: "red" }));

    // The hook should immediately reflect the change in its local state
    expect(result.current.vertexStyle).toStrictEqual(
      createExpectedVertex({
        type: createVertexType("test"),
        color: "red",
      }),
    );

    // Test that subsequent updates work correctly
    act(() => result.current.setVertexStyle({ borderColor: "blue" }));

    expect(result.current.vertexStyle).toStrictEqual(
      createExpectedVertex({
        type: createVertexType("test"),
        color: "red",
        borderColor: "blue",
      }),
    );
  });
});
