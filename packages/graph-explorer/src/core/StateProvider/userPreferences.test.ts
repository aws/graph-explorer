import { DbState, renderHookWithJotai } from "@/utils/testing";
import { useEdgeStyling, useVertexStyling } from "./userPreferences";
import { act } from "react";

describe("useVertexStyling", () => {
  it("should return undefined when the style does not exist", () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useVertexStyling("test"),
      store => dbState.applyTo(store)
    );

    expect(result.current.vertexStyle).toBeUndefined();
  });

  it("should return the vertex style when it exists", () => {
    const dbState = new DbState();
    const style = dbState.addVertexStyle("test", { color: "red" });
    const { result } = renderHookWithJotai(
      () => useVertexStyling("test"),
      store => dbState.applyTo(store)
    );

    expect(result.current.vertexStyle).toEqual(style);
  });

  it("should insert the vertex style when none exist", () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useVertexStyling("test"),
      store => dbState.applyTo(store)
    );

    act(() => result.current.setVertexStyle({ color: "red" }));

    expect(result.current.vertexStyle).toEqual({ type: "test", color: "red" });
  });

  it("should update the existing style, merging new styles", () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useVertexStyling("test"),
      store => dbState.applyTo(store)
    );

    act(() =>
      result.current.setVertexStyle({ color: "red", borderColor: "green" })
    );
    act(() => result.current.setVertexStyle({ borderColor: "blue" }));

    expect(result.current.vertexStyle).toEqual({
      type: "test",
      color: "red",
      borderColor: "blue",
    });
  });

  it("should reset the vertex style", () => {
    const dbState = new DbState();
    dbState.addVertexStyle("test", { borderColor: "blue" });

    const { result } = renderHookWithJotai(
      () => useVertexStyling("test"),
      store => dbState.applyTo(store)
    );

    act(() => result.current.resetVertexStyle());

    expect(result.current.vertexStyle).toBeUndefined();
  });

  it("should not affect other vertex styles when updating", () => {
    const dbState = new DbState();
    dbState.addVertexStyle("type1", { color: "red" });
    dbState.addVertexStyle("type2", { color: "blue" });

    const { result } = renderHookWithJotai(
      () => useVertexStyling("type1"),
      store => dbState.applyTo(store)
    );

    act(() => result.current.setVertexStyle({ borderColor: "green" }));

    // Check that type1 was updated
    expect(result.current.vertexStyle).toEqual({
      type: "type1",
      color: "red",
      borderColor: "green",
    });

    // Check that type2 was not affected by getting its hook
    const { result: result2 } = renderHookWithJotai(
      () => useVertexStyling("type2"),
      store => dbState.applyTo(store)
    );
    expect(result2.current.vertexStyle).toEqual({
      type: "type2",
      color: "blue",
    });
  });

  it("should not affect other vertex styles when resetting", () => {
    const dbState = new DbState();
    dbState.addVertexStyle("type1", { color: "red" });
    dbState.addVertexStyle("type2", { color: "blue" });

    const { result } = renderHookWithJotai(
      () => useVertexStyling("type1"),
      store => dbState.applyTo(store)
    );

    act(() => result.current.resetVertexStyle());

    expect(result.current.vertexStyle).toBeUndefined();

    // Check that type2 still exists
    const { result: result2 } = renderHookWithJotai(
      () => useVertexStyling("type2"),
      store => dbState.applyTo(store)
    );
    expect(result2.current.vertexStyle).toEqual({
      type: "type2",
      color: "blue",
    });
  });

  it("should handle empty style updates", () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useVertexStyling("test"),
      store => dbState.applyTo(store)
    );

    act(() => result.current.setVertexStyle({}));

    expect(result.current.vertexStyle).toEqual({ type: "test" });
  });
});

describe("useEdgeStyling", () => {
  it("should return undefined when the style does not exist", () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useEdgeStyling("test"),
      store => dbState.applyTo(store)
    );

    expect(result.current.edgeStyle).toBeUndefined();
  });

  it("should return the edge style when it exists", () => {
    const dbState = new DbState();
    const style = dbState.addEdgeStyle("test", { lineColor: "red" });
    const { result } = renderHookWithJotai(
      () => useEdgeStyling("test"),
      store => dbState.applyTo(store)
    );

    expect(result.current.edgeStyle).toEqual(style);
  });

  it("should insert the edge style when none exist", () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useEdgeStyling("test"),
      store => dbState.applyTo(store)
    );

    act(() => result.current.setEdgeStyle({ lineColor: "red" }));

    expect(result.current.edgeStyle).toEqual({
      type: "test",
      lineColor: "red",
    });
  });

  it("should update the existing style, merging new styles", () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useEdgeStyling("test"),
      store => dbState.applyTo(store)
    );

    act(() =>
      result.current.setEdgeStyle({ lineColor: "red", labelColor: "green" })
    );
    act(() => result.current.setEdgeStyle({ labelColor: "blue" }));

    expect(result.current.edgeStyle).toEqual({
      type: "test",
      lineColor: "red",
      labelColor: "blue",
    });
  });

  it("should reset the edge style", () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useEdgeStyling("test"),
      store => dbState.applyTo(store)
    );

    act(() => result.current.setEdgeStyle({ labelColor: "blue" }));
    act(() => result.current.resetEdgeStyle());

    expect(result.current.edgeStyle).toBeUndefined();
  });

  it("should not affect other edge styles when updating", () => {
    const dbState = new DbState();
    dbState.addEdgeStyle("type1", { lineColor: "red" });
    dbState.addEdgeStyle("type2", { lineColor: "blue" });

    const { result } = renderHookWithJotai(
      () => useEdgeStyling("type1"),
      store => dbState.applyTo(store)
    );

    act(() => result.current.setEdgeStyle({ labelColor: "green" }));

    // Check that type1 was updated
    expect(result.current.edgeStyle).toEqual({
      type: "type1",
      lineColor: "red",
      labelColor: "green",
    });

    // Check that type2 was not affected
    const { result: result2 } = renderHookWithJotai(
      () => useEdgeStyling("type2"),
      store => dbState.applyTo(store)
    );
    expect(result2.current.edgeStyle).toEqual({
      type: "type2",
      lineColor: "blue",
    });
  });

  it("should not affect other edge styles when resetting", () => {
    const dbState = new DbState();
    dbState.addEdgeStyle("type1", { lineColor: "red" });
    dbState.addEdgeStyle("type2", { lineColor: "blue" });

    const { result } = renderHookWithJotai(
      () => useEdgeStyling("type1"),
      store => dbState.applyTo(store)
    );

    act(() => result.current.resetEdgeStyle());

    expect(result.current.edgeStyle).toBeUndefined();

    // Check that type2 still exists
    const { result: result2 } = renderHookWithJotai(
      () => useEdgeStyling("type2"),
      store => dbState.applyTo(store)
    );
    expect(result2.current.edgeStyle).toEqual({
      type: "type2",
      lineColor: "blue",
    });
  });

  it("should handle empty style updates", () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useEdgeStyling("test"),
      store => dbState.applyTo(store)
    );

    act(() => result.current.setEdgeStyle({}));

    expect(result.current.edgeStyle).toEqual({ type: "test" });
  });
});

describe("useDeferredAtom integration", () => {
  it("should handle multiple rapid updates correctly", () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useVertexStyling("test"),
      store => dbState.applyTo(store)
    );

    // Simulate rapid updates that might happen in real usage
    act(() => {
      result.current.setVertexStyle({ color: "red" });
      result.current.setVertexStyle({ borderColor: "blue" });
      result.current.setVertexStyle({ shape: "ellipse" });
    });

    expect(result.current.vertexStyle).toEqual({
      type: "test",
      color: "red",
      borderColor: "blue",
      shape: "ellipse",
    });
  });

  it("should handle deferred atom updates correctly", () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useVertexStyling("test"),
      store => dbState.applyTo(store)
    );

    // Test that the deferred atom pattern works with the hook
    act(() => result.current.setVertexStyle({ color: "red" }));

    // The hook should immediately reflect the change in its local state
    expect(result.current.vertexStyle).toEqual({
      type: "test",
      color: "red",
    });

    // Test that subsequent updates work correctly
    act(() => result.current.setVertexStyle({ borderColor: "blue" }));

    expect(result.current.vertexStyle).toEqual({
      type: "test",
      color: "red",
      borderColor: "blue",
    });
  });
});
