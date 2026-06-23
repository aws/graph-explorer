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
  reconcileUserStyling,
  useEdgeStyling,
  useVertexStyling,
  type UserStyling,
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

describe("vertexPreferencesAtom", () => {
  it("should return stored preferences for a known type", () => {
    const dbState = new DbState();
    const vertexType = createVertexType("Person");
    dbState.addVertexStyle(vertexType, { color: "#ff0000" });

    const { result } = renderHookWithState(
      () => useAtomValue(vertexPreferencesAtom),
      dbState,
    );

    expect(result.current.get(vertexType)).toStrictEqual(
      createExpectedVertex({ type: vertexType, color: "#ff0000" }),
    );
  });

  it("should return defaults for an unknown type", () => {
    const dbState = new DbState();
    const vertexType = createVertexType("Unknown");

    const { result } = renderHookWithState(
      () => useAtomValue(vertexPreferencesAtom),
      dbState,
    );

    expect(result.current.get(vertexType)).toStrictEqual(
      createExpectedVertex({ type: vertexType }),
    );
  });
});

describe("edgePreferencesAtom", () => {
  it("should return stored preferences for a known type", () => {
    const dbState = new DbState();
    const edgeType = createEdgeType("KNOWS");
    dbState.addEdgeStyle(edgeType, { lineColor: "#00ff00" });

    const { result } = renderHookWithState(
      () => useAtomValue(edgePreferencesAtom),
      dbState,
    );

    expect(result.current.get(edgeType)).toStrictEqual(
      createExpectedEdge({ type: edgeType, lineColor: "#00ff00" }),
    );
  });

  it("should return defaults for an unknown type", () => {
    const dbState = new DbState();
    const edgeType = createEdgeType("Unknown");

    const { result } = renderHookWithState(
      () => useAtomValue(edgePreferencesAtom),
      dbState,
    );

    expect(result.current.get(edgeType)).toStrictEqual(
      createExpectedEdge({ type: edgeType }),
    );
  });
});

describe("reconcileUserStyling", () => {
  it("preserves a sibling vertex entry another tab added", () => {
    const ownType = createVertexType("own");
    const siblingType = createVertexType("sibling");

    // This tab loaded with empty styling and added its own type.
    const previous: UserStyling = {};
    const next: UserStyling = { vertices: [{ type: ownType, color: "red" }] };

    // Meanwhile another tab persisted a sibling type.
    const persisted: UserStyling = {
      vertices: [{ type: siblingType, color: "blue" }],
    };

    const merged = reconcileUserStyling({ persisted, previous, next });

    expect(merged.vertices).toStrictEqual([
      { type: siblingType, color: "blue" },
      { type: ownType, color: "red" },
    ]);
  });

  it("applies this tab's update over the persisted entry for the same type", () => {
    const sharedType = createVertexType("shared");

    const previous: UserStyling = {
      vertices: [{ type: sharedType, color: "red" }],
    };
    const next: UserStyling = {
      vertices: [{ type: sharedType, color: "green" }],
    };
    const persisted: UserStyling = {
      vertices: [{ type: sharedType, color: "blue" }],
    };

    const merged = reconcileUserStyling({ persisted, previous, next });

    expect(merged.vertices).toStrictEqual([
      { type: sharedType, color: "green" },
    ]);
  });

  it("drops a type this tab removed while keeping a sibling", () => {
    const removedType = createVertexType("removed");
    const siblingType = createVertexType("sibling");

    const previous: UserStyling = {
      vertices: [{ type: removedType, color: "red" }],
    };
    const next: UserStyling = {};
    const persisted: UserStyling = {
      vertices: [
        { type: removedType, color: "red" },
        { type: siblingType, color: "blue" },
      ],
    };

    const merged = reconcileUserStyling({ persisted, previous, next });

    expect(merged.vertices).toStrictEqual([
      { type: siblingType, color: "blue" },
    ]);
  });

  it("merges edge entries independently of vertices", () => {
    const ownEdge = createEdgeType("own");
    const siblingEdge = createEdgeType("sibling");

    const previous: UserStyling = {};
    const next: UserStyling = { edges: [{ type: ownEdge, lineColor: "red" }] };
    const persisted: UserStyling = {
      edges: [{ type: siblingEdge, lineColor: "blue" }],
    };

    const merged = reconcileUserStyling({ persisted, previous, next });

    expect(merged.edges).toStrictEqual([
      { type: siblingEdge, lineColor: "blue" },
      { type: ownEdge, lineColor: "red" },
    ]);
  });

  it("omits empty collections rather than storing undefined keys", () => {
    const merged = reconcileUserStyling({
      persisted: {},
      previous: {},
      next: {},
    });

    expect(merged).toStrictEqual({});
  });
});
