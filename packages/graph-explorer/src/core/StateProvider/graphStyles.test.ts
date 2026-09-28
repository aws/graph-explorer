// @vitest-environment happy-dom
import { useAtomValue } from "jotai";
import { act } from "react";

import { createEdgeType, createVertexType } from "@/core";
import { DbState, renderHookWithState } from "@/utils/testing";

import type { VertexType } from "../entities";

import {
  appDefaultEdgeStyle,
  appDefaultVertexStyle,
  edgeStyleAtom,
  type EdgeStyleStorage,
  mergeVertexStyleFields,
  useEdgeStyling,
  useVertexStyling,
  vertexStyleAtom,
  type VertexStyleStorage,
  vertexTypeSetKey,
} from "./graphStyles";

function createExpectedVertex(existing: VertexStyleStorage) {
  return {
    ...appDefaultVertexStyle,
    ...existing,
  };
}

function createExpectedEdge(existing: EdgeStyleStorage) {
  return {
    ...appDefaultEdgeStyle,
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

describe("vertexStyleAtom", () => {
  it("should return stored styles for a known type", () => {
    const dbState = new DbState();
    const vertexType = createVertexType("Person");
    dbState.addVertexStyle(vertexType, { color: "#ff0000" });

    const { result } = renderHookWithState(
      () => useAtomValue(vertexStyleAtom),
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
      () => useAtomValue(vertexStyleAtom),
      dbState,
    );

    expect(result.current.get(vertexType)).toStrictEqual(
      createExpectedVertex({ type: vertexType }),
    );
  });
});

describe("edgeStyleAtom", () => {
  it("should return stored styles for a known type", () => {
    const dbState = new DbState();
    const edgeType = createEdgeType("KNOWS");
    dbState.addEdgeStyle(edgeType, { lineColor: "#00ff00" });

    const { result } = renderHookWithState(
      () => useAtomValue(edgeStyleAtom),
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
      () => useAtomValue(edgeStyleAtom),
      dbState,
    );

    expect(result.current.get(edgeType)).toStrictEqual(
      createExpectedEdge({ type: edgeType }),
    );
  });
});

describe("vertexTypeSetKey", () => {
  it("is stable regardless of the input order", () => {
    const a = createVertexType("A");
    const b = createVertexType("B");
    const c = createVertexType("C");

    expect(vertexTypeSetKey([a, b, c])).toBe(vertexTypeSetKey([c, a, b]));
  });

  it("ignores duplicate types", () => {
    const a = createVertexType("A");
    const b = createVertexType("B");

    expect(vertexTypeSetKey([a, b, a])).toBe(vertexTypeSetKey([a, b]));
  });

  it("differs for different type sets", () => {
    const a = createVertexType("A");
    const b = createVertexType("B");

    expect(vertexTypeSetKey([a])).not.toBe(vertexTypeSetKey([a, b]));
  });
});

describe("mergeVertexStyleFields", () => {
  it("merges non-conflicting fields from every type", () => {
    const equipment = createVertexType("Equipment");
    const breaker = createVertexType("Breaker");
    const userStyles = new Map<VertexType, VertexStyleStorage>([
      [equipment, { type: equipment, borderColor: "black", shape: "hexagon" }],
      [breaker, { type: breaker, color: "red", iconUrl: "lucide:zap-off" }],
    ]);

    expect(
      mergeVertexStyleFields([breaker, equipment], userStyles),
    ).toStrictEqual({
      borderColor: "black",
      shape: "hexagon",
      color: "red",
      iconUrl: "lucide:zap-off",
    });
  });

  it("resolves a field set by more than one type by lexicographic order, last wins", () => {
    const a = createVertexType("A");
    const z = createVertexType("Z");
    const userStyles = new Map<VertexType, VertexStyleStorage>([
      [a, { type: a, color: "from-a" }],
      [z, { type: z, color: "from-z" }],
    ]);

    // Order of the input array must not matter — only the type names' sort order does.
    expect(mergeVertexStyleFields([a, z], userStyles).color).toBe("from-z");
    expect(mergeVertexStyleFields([z, a], userStyles).color).toBe("from-z");
  });

  it("skips types with no stored style", () => {
    const styled = createVertexType("Styled");
    const unstyled = createVertexType("Unstyled");
    const userStyles = new Map<VertexType, VertexStyleStorage>([
      [styled, { type: styled, color: "red" }],
    ]);

    expect(
      mergeVertexStyleFields([styled, unstyled], userStyles),
    ).toStrictEqual({ color: "red" });
  });

  it("returns an empty object when no type has a stored style", () => {
    const a = createVertexType("A");
    expect(mergeVertexStyleFields([a], new Map())).toStrictEqual({});
  });
});

describe("vertexStyleAtom.getForTypes", () => {
  it("merges styles across all of a vertex's types, overlaid on defaults", () => {
    const dbState = new DbState();
    const equipment = createVertexType("Equipment");
    const breaker = createVertexType("Breaker");
    dbState.addVertexStyle(equipment, { borderColor: "black" });
    dbState.addVertexStyle(breaker, { color: "red" });

    const { result } = renderHookWithState(
      () => useAtomValue(vertexStyleAtom),
      dbState,
    );

    const resolved = result.current.getForTypes([breaker, equipment]);
    expect(resolved.color).toBe("red");
    expect(resolved.borderColor).toBe("black");
    // Every other field still falls back to the app default.
    expect(resolved.shape).toBe(appDefaultVertexStyle.shape);
  });

  it("is order-independent — the same two types resolve identically regardless of array order", () => {
    const dbState = new DbState();
    const a = createVertexType("A");
    const z = createVertexType("Z");
    dbState.addVertexStyle(a, { color: "from-a" });
    dbState.addVertexStyle(z, { color: "from-z" });

    const { result } = renderHookWithState(
      () => useAtomValue(vertexStyleAtom),
      dbState,
    );

    expect(result.current.getForTypes([a, z])).toStrictEqual(
      result.current.getForTypes([z, a]),
    );
  });
});
