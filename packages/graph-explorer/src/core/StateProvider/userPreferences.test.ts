import { DbState, renderHookWithJotai } from "@/utils/testing";
import { useEdgeStyling, useVertexStyling } from "./userPreferences";
import { act } from "react";

describe("useVertexStyling", () => {
  it("should return undefined when the style does not exist", () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useVertexStyling("test"),
      snapshot => dbState.applyTo(snapshot)
    );

    expect(result.current.vertexStyle).toBeUndefined();
  });

  it("should return the vertex style when it exists", () => {
    const dbState = new DbState();
    const style = dbState.addVertexStyle("test", { color: "red" });
    const { result } = renderHookWithJotai(
      () => useVertexStyling("test"),
      snapshot => dbState.applyTo(snapshot)
    );

    expect(result.current.vertexStyle).toEqual(style);
  });

  it("should insert the vertex style when none exist", () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useVertexStyling("test"),
      snapshot => dbState.applyTo(snapshot)
    );

    act(() => result.current.setVertexStyle({ color: "red" }));

    expect(result.current.vertexStyle).toEqual({ type: "test", color: "red" });
  });

  it("should update the existing style, merging new styles", () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useVertexStyling("test"),
      snapshot => dbState.applyTo(snapshot)
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
      snapshot => dbState.applyTo(snapshot)
    );

    act(() => result.current.resetVertexStyle());

    expect(result.current.vertexStyle).toBeUndefined();
  });
});

describe("useEdgeStyling", () => {
  it("should return undefined when the style does not exist", () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useEdgeStyling("test"),
      snapshot => dbState.applyTo(snapshot)
    );

    expect(result.current.edgeStyle).toBeUndefined();
  });

  it("should return the edge style when it exists", () => {
    const dbState = new DbState();
    const style = dbState.addEdgeStyle("test", { lineColor: "red" });
    const { result } = renderHookWithJotai(
      () => useEdgeStyling("test"),
      snapshot => dbState.applyTo(snapshot)
    );

    expect(result.current.edgeStyle).toEqual(style);
  });

  it("should insert the edge style when none exist", () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useEdgeStyling("test"),
      snapshot => dbState.applyTo(snapshot)
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
      snapshot => dbState.applyTo(snapshot)
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
      snapshot => dbState.applyTo(snapshot)
    );

    act(() => result.current.setEdgeStyle({ labelColor: "blue" }));
    act(() => result.current.resetEdgeStyle());

    expect(result.current.edgeStyle).toBeUndefined();
  });
});
