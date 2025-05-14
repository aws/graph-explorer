import { DbState, renderHookWithJotai } from "@/utils/testing";
import { useEdgeStyling, useVertexStyling } from "./userPreferences";
import { act } from "react";

describe("useVertexStyling", () => {
  it("should return the vertex style if it exists", () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useVertexStyling("test"),
      snapshot => dbState.applyTo(snapshot)
    );

    expect(result.current.vertexStyle).toBeUndefined();
  });

  it("should insert the vertex style when none exist", async () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useVertexStyling("test"),
      snapshot => dbState.applyTo(snapshot)
    );

    await act(() => result.current.setVertexStyle({ color: "red" }));

    expect(result.current.vertexStyle).toEqual({ type: "test", color: "red" });
  });

  it("should update the existing style, merging new styles", async () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useVertexStyling("test"),
      snapshot => dbState.applyTo(snapshot)
    );

    await act(() =>
      result.current.setVertexStyle({ color: "red", borderColor: "green" })
    );
    await act(() => result.current.setVertexStyle({ borderColor: "blue" }));

    expect(result.current.vertexStyle).toEqual({
      type: "test",
      color: "red",
      borderColor: "blue",
    });
  });

  it("should reset the vertex style", async () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useVertexStyling("test"),
      snapshot => dbState.applyTo(snapshot)
    );

    await act(() => result.current.setVertexStyle({ borderColor: "blue" }));
    await act(() => result.current.resetVertexStyle());

    expect(result.current.vertexStyle).toBeUndefined();
  });
});

describe("useEdgeStyling", () => {
  it("should return the edge style if it exists", () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useEdgeStyling("test"),
      snapshot => dbState.applyTo(snapshot)
    );

    expect(result.current.edgeStyle).toBeUndefined();
  });

  it("should insert the edge style when none exist", async () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useEdgeStyling("test"),
      snapshot => dbState.applyTo(snapshot)
    );

    await act(() => result.current.setEdgeStyle({ lineColor: "red" }));

    expect(result.current.edgeStyle).toEqual({
      type: "test",
      lineColor: "red",
    });
  });

  it("should update the existing style, merging new styles", async () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useEdgeStyling("test"),
      snapshot => dbState.applyTo(snapshot)
    );

    await act(() =>
      result.current.setEdgeStyle({ lineColor: "red", labelColor: "green" })
    );
    await act(() => result.current.setEdgeStyle({ labelColor: "blue" }));

    expect(result.current.edgeStyle).toEqual({
      type: "test",
      lineColor: "red",
      labelColor: "blue",
    });
  });

  it("should reset the edge style", async () => {
    const dbState = new DbState();
    const { result } = renderHookWithJotai(
      () => useEdgeStyling("test"),
      snapshot => dbState.applyTo(snapshot)
    );

    await act(() => result.current.setEdgeStyle({ labelColor: "blue" }));
    await act(() => result.current.resetEdgeStyle());

    expect(result.current.edgeStyle).toBeUndefined();
  });
});
