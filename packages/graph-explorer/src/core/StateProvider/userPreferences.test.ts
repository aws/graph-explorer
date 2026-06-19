// @vitest-environment happy-dom
import { useAtomValue } from "jotai";
import { act } from "react";

import { createEdgeType, createVertexType } from "@/core";
import { DbState, renderHookWithState } from "@/utils/testing";

import {
  defaultEdgePreferences,
  defaultVertexPreferences,
  edgePreferencesAtom,
  type EdgePreferencesStorageModel,
  useEdgeStyling,
  useVertexStyling,
  vertexPreferencesAtom,
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
  it("should return defaults when the style does not exist", async () => {
    const dbState = new DbState();
    const { result } = await renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );
    const expected = createExpectedVertex({ type: createVertexType("test") });

    expect(result.current.vertexStyle).toStrictEqual(expected);
  });

  it("should return the vertex style when it exists", async () => {
    const dbState = new DbState();
    const style = dbState.addVertexStyle(createVertexType("test"), {
      color: "red",
    });
    const expected = createExpectedVertex(style);

    const { result } = await renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );

    expect(result.current.vertexStyle).toStrictEqual(expected);
  });

  it("should insert the vertex style when none exist", async () => {
    const dbState = new DbState();
    const { result } = await renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );

    await act(async () => result.current.setVertexStyle({ color: "red" }));

    expect(result.current.vertexStyle).toStrictEqual(
      createExpectedVertex({ type: createVertexType("test"), color: "red" }),
    );
  });

  it("should update the existing style, merging new styles", async () => {
    const dbState = new DbState();
    const { result } = await renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );

    await act(async () =>
      result.current.setVertexStyle({ color: "red", borderColor: "green" }),
    );
    await act(async () =>
      result.current.setVertexStyle({ borderColor: "blue" }),
    );

    expect(result.current.vertexStyle).toStrictEqual(
      createExpectedVertex({
        type: createVertexType("test"),
        color: "red",
        borderColor: "blue",
      }),
    );
  });

  it("should reset the vertex style", async () => {
    const dbState = new DbState();
    dbState.addVertexStyle(createVertexType("test"), { borderColor: "blue" });

    const { result } = await renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );

    await act(async () => result.current.resetVertexStyle());

    expect(result.current.vertexStyle).toStrictEqual(
      createExpectedVertex({ type: createVertexType("test") }),
    );
  });

  it("should not affect other vertex styles when updating", async () => {
    const dbState = new DbState();
    dbState.addVertexStyle(createVertexType("type1"), { color: "red" });
    dbState.addVertexStyle(createVertexType("type2"), { color: "blue" });

    const { result } = await renderHookWithState(
      () => useVertexStyling(createVertexType("type1")),
      dbState,
    );

    await act(async () =>
      result.current.setVertexStyle({ borderColor: "green" }),
    );

    // Check that type1 was updated
    expect(result.current.vertexStyle).toStrictEqual(
      createExpectedVertex({
        type: createVertexType("type1"),
        color: "red",
        borderColor: "green",
      }),
    );

    // Check that type2 was not affected by getting its hook
    const { result: result2 } = await renderHookWithState(
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

  it("should not affect other vertex styles when resetting", async () => {
    const dbState = new DbState();
    dbState.addVertexStyle(createVertexType("type1"), { color: "red" });
    dbState.addVertexStyle(createVertexType("type2"), { color: "blue" });

    const { result } = await renderHookWithState(
      () => useVertexStyling(createVertexType("type1")),
      dbState,
    );

    await act(async () => result.current.resetVertexStyle());

    expect(result.current.vertexStyle).toStrictEqual(
      createExpectedVertex({ type: createVertexType("type1") }),
    );

    // Check that type2 still exists
    const { result: result2 } = await renderHookWithState(
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

  it("should handle empty style updates", async () => {
    const dbState = new DbState();
    const { result } = await renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );

    await act(async () => result.current.setVertexStyle({}));

    expect(result.current.vertexStyle).toStrictEqual(
      createExpectedVertex({ type: createVertexType("test") }),
    );
  });
});

describe("useEdgeStyling", () => {
  it("should return defaults when the style does not exist", async () => {
    const dbState = new DbState();
    const { result } = await renderHookWithState(
      () => useEdgeStyling(createEdgeType("test")),
      dbState,
    );

    expect(result.current.edgeStyle).toStrictEqual(
      createExpectedEdge({ type: createEdgeType("test") }),
    );
  });

  it("should return the edge style when it exists", async () => {
    const dbState = new DbState();
    const style = dbState.addEdgeStyle(createEdgeType("test"), {
      lineColor: "red",
    });
    const { result } = await renderHookWithState(
      () => useEdgeStyling(createEdgeType("test")),
      dbState,
    );

    expect(result.current.edgeStyle).toStrictEqual(createExpectedEdge(style));
  });

  it("should insert the edge style when none exist", async () => {
    const dbState = new DbState();
    const { result } = await renderHookWithState(
      () => useEdgeStyling(createEdgeType("test")),
      dbState,
    );

    await act(async () => result.current.setEdgeStyle({ lineColor: "red" }));

    expect(result.current.edgeStyle).toStrictEqual(
      createExpectedEdge({
        type: createEdgeType("test"),
        lineColor: "red",
      }),
    );
  });

  it("should update the existing style, merging new styles", async () => {
    const dbState = new DbState();
    const { result } = await renderHookWithState(
      () => useEdgeStyling(createEdgeType("test")),
      dbState,
    );

    await act(async () =>
      result.current.setEdgeStyle({ lineColor: "red", labelColor: "green" }),
    );
    await act(async () => result.current.setEdgeStyle({ labelColor: "blue" }));

    expect(result.current.edgeStyle).toStrictEqual(
      createExpectedEdge({
        type: createEdgeType("test"),
        lineColor: "red",
        labelColor: "blue",
      }),
    );
  });

  it("should reset the edge style", async () => {
    const dbState = new DbState();
    const { result } = await renderHookWithState(
      () => useEdgeStyling(createEdgeType("test")),
      dbState,
    );

    await act(async () => result.current.setEdgeStyle({ labelColor: "blue" }));
    await act(async () => result.current.resetEdgeStyle());

    expect(result.current.edgeStyle).toStrictEqual(
      createExpectedEdge({ type: createEdgeType("test") }),
    );
  });

  it("should not affect other edge styles when updating", async () => {
    const dbState = new DbState();
    dbState.addEdgeStyle(createEdgeType("type1"), { lineColor: "red" });
    dbState.addEdgeStyle(createEdgeType("type2"), { lineColor: "blue" });

    const { result } = await renderHookWithState(
      () => useEdgeStyling(createEdgeType("type1")),
      dbState,
    );

    await act(async () => result.current.setEdgeStyle({ labelColor: "green" }));

    // Check that type1 was updated
    expect(result.current.edgeStyle).toStrictEqual(
      createExpectedEdge({
        type: createEdgeType("type1"),
        lineColor: "red",
        labelColor: "green",
      }),
    );

    // Check that type2 was not affected
    const { result: result2 } = await renderHookWithState(
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

  it("should not affect other edge styles when resetting", async () => {
    const dbState = new DbState();
    dbState.addEdgeStyle(createEdgeType("type1"), { lineColor: "red" });
    dbState.addEdgeStyle(createEdgeType("type2"), { lineColor: "blue" });

    const { result } = await renderHookWithState(
      () => useEdgeStyling(createEdgeType("type1")),
      dbState,
    );

    await act(async () => result.current.resetEdgeStyle());

    expect(result.current.edgeStyle).toStrictEqual(
      createExpectedEdge({ type: createEdgeType("type1") }),
    );

    // Check that type2 still exists
    const { result: result2 } = await renderHookWithState(
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

  it("should handle empty style updates", async () => {
    const dbState = new DbState();
    const { result } = await renderHookWithState(
      () => useEdgeStyling(createEdgeType("test")),
      dbState,
    );

    await act(async () => result.current.setEdgeStyle({}));

    expect(result.current.edgeStyle).toStrictEqual(
      createExpectedEdge({ type: createEdgeType("test") }),
    );
  });
});

describe("useDeferredAtom integration", () => {
  it("should handle multiple rapid updates correctly", async () => {
    const dbState = new DbState();
    const { result } = await renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );

    // Simulate rapid updates that might happen in real usage
    await act(async () => {
      await result.current.setVertexStyle({ color: "red" });
      await result.current.setVertexStyle({ borderColor: "blue" });
      await result.current.setVertexStyle({ shape: "ellipse" });
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

  it("should handle deferred atom updates correctly", async () => {
    const dbState = new DbState();
    const { result } = await renderHookWithState(
      () => useVertexStyling(createVertexType("test")),
      dbState,
    );

    // Test that the deferred atom pattern works with the hook
    await act(async () => result.current.setVertexStyle({ color: "red" }));

    // The hook should immediately reflect the change in its local state
    expect(result.current.vertexStyle).toStrictEqual(
      createExpectedVertex({
        type: createVertexType("test"),
        color: "red",
      }),
    );

    // Test that subsequent updates work correctly
    await act(async () =>
      result.current.setVertexStyle({ borderColor: "blue" }),
    );

    expect(result.current.vertexStyle).toStrictEqual(
      createExpectedVertex({
        type: createVertexType("test"),
        color: "red",
        borderColor: "blue",
      }),
    );
  });
});

describe("vertexPreferencesAtom", () => {
  it("should return stored preferences for a known type", async () => {
    const dbState = new DbState();
    const vertexType = createVertexType("Person");
    dbState.addVertexStyle(vertexType, { color: "#ff0000" });

    const { result } = await renderHookWithState(
      () => useAtomValue(vertexPreferencesAtom),
      dbState,
    );

    expect(result.current.get(vertexType)).toStrictEqual(
      createExpectedVertex({ type: vertexType, color: "#ff0000" }),
    );
  });

  it("should return defaults for an unknown type", async () => {
    const dbState = new DbState();
    const vertexType = createVertexType("Unknown");

    const { result } = await renderHookWithState(
      () => useAtomValue(vertexPreferencesAtom),
      dbState,
    );

    expect(result.current.get(vertexType)).toStrictEqual(
      createExpectedVertex({ type: vertexType }),
    );
  });
});

describe("edgePreferencesAtom", () => {
  it("should return stored preferences for a known type", async () => {
    const dbState = new DbState();
    const edgeType = createEdgeType("KNOWS");
    dbState.addEdgeStyle(edgeType, { lineColor: "#00ff00" });

    const { result } = await renderHookWithState(
      () => useAtomValue(edgePreferencesAtom),
      dbState,
    );

    expect(result.current.get(edgeType)).toStrictEqual(
      createExpectedEdge({ type: edgeType, lineColor: "#00ff00" }),
    );
  });

  it("should return defaults for an unknown type", async () => {
    const dbState = new DbState();
    const edgeType = createEdgeType("Unknown");

    const { result } = await renderHookWithState(
      () => useAtomValue(edgePreferencesAtom),
      dbState,
    );

    expect(result.current.get(edgeType)).toStrictEqual(
      createExpectedEdge({ type: edgeType }),
    );
  });
});
