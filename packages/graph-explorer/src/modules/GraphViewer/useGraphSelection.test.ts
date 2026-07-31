// @vitest-environment happy-dom
import { act } from "react";

import { useGraphViewSidebar } from "@/core";
import { DbState, renderHookWithState } from "@/utils/testing";
import { createRandomEdgeId, createRandomVertexId } from "@/utils/testing";

import { useGraphSelection } from "./useGraphSelection";

/**
 * Seeds a known pre-selection layout — sidebar open on Search with auto-open
 * enabled — so the auto-open assertions measure the selection's effect rather
 * than the random default layout DbState would otherwise apply.
 */
function stateWithSearchTabAndAutoOpen() {
  return new DbState().withGraphViewLayout({
    activeSidebarItem: "search",
    activeToggles: new Set(),
    sidebar: { width: 400 },
    detailsAutoOpenOnSelection: true,
  });
}

describe("useGraphSelection", () => {
  test("should return empty selection initially", () => {
    const { result } = renderHookWithState(() => useGraphSelection());

    expect(result.current.graphSelection.vertices).toStrictEqual([]);
    expect(result.current.graphSelection.edges).toStrictEqual([]);
  });

  test("should update vertex selection", () => {
    const { result } = renderHookWithState(() => useGraphSelection());

    const vertexId1 = createRandomVertexId();
    const vertexId2 = createRandomVertexId();

    act(() =>
      result.current.replaceGraphSelection({
        vertices: [vertexId1, vertexId2],
        disableSideEffects: true,
      }),
    );

    expect(result.current.graphSelection.vertices).toStrictEqual([
      vertexId1,
      vertexId2,
    ]);
    expect(result.current.graphSelection.edges).toStrictEqual([]);
  });

  test("should update edge selection", () => {
    const { result } = renderHookWithState(() => useGraphSelection());

    const edgeId1 = createRandomEdgeId();
    const edgeId2 = createRandomEdgeId();

    act(() =>
      result.current.replaceGraphSelection({
        edges: [edgeId1, edgeId2],
        disableSideEffects: true,
      }),
    );

    expect(result.current.graphSelection.vertices).toStrictEqual([]);
    expect(result.current.graphSelection.edges).toStrictEqual([
      edgeId1,
      edgeId2,
    ]);
  });

  test("should update both vertices and edges selection", () => {
    const { result } = renderHookWithState(() => useGraphSelection());

    const vertexId = createRandomVertexId();
    const edgeId = createRandomEdgeId();

    act(() =>
      result.current.replaceGraphSelection({
        vertices: [vertexId],
        edges: [edgeId],
        disableSideEffects: true,
      }),
    );

    expect(result.current.graphSelection.vertices).toStrictEqual([vertexId]);
    expect(result.current.graphSelection.edges).toStrictEqual([edgeId]);
  });

  test("should replace previous selection when updating", () => {
    const { result } = renderHookWithState(() => useGraphSelection());

    const vertexId1 = createRandomVertexId();
    const vertexId2 = createRandomVertexId();

    act(() =>
      result.current.replaceGraphSelection({
        vertices: [vertexId1],
        disableSideEffects: true,
      }),
    );

    act(() =>
      result.current.replaceGraphSelection({
        vertices: [vertexId2],
        disableSideEffects: true,
      }),
    );

    expect(result.current.graphSelection.vertices).toStrictEqual([vertexId2]);
  });

  test("should clear selection when called with empty arrays", () => {
    const { result } = renderHookWithState(() => useGraphSelection());

    const vertexId = createRandomVertexId();
    const edgeId = createRandomEdgeId();

    act(() =>
      result.current.replaceGraphSelection({
        vertices: [vertexId],
        edges: [edgeId],
        disableSideEffects: true,
      }),
    );

    act(() =>
      result.current.replaceGraphSelection({
        vertices: [],
        edges: [],
        disableSideEffects: true,
      }),
    );

    expect(result.current.graphSelection.vertices).toStrictEqual([]);
    expect(result.current.graphSelection.edges).toStrictEqual([]);
  });

  test("should handle Set as input for vertices", () => {
    const { result } = renderHookWithState(() => useGraphSelection());

    const vertexId1 = createRandomVertexId();
    const vertexId2 = createRandomVertexId();
    const vertexSet = new Set([vertexId1, vertexId2]);

    act(() =>
      result.current.replaceGraphSelection({
        vertices: vertexSet,
        disableSideEffects: true,
      }),
    );

    expect(result.current.graphSelection.vertices).toStrictEqual([
      vertexId1,
      vertexId2,
    ]);
  });

  test("should handle Set as input for edges", () => {
    const { result } = renderHookWithState(() => useGraphSelection());

    const edgeId1 = createRandomEdgeId();
    const edgeId2 = createRandomEdgeId();
    const edgeSet = new Set([edgeId1, edgeId2]);

    act(() =>
      result.current.replaceGraphSelection({
        edges: edgeSet,
        disableSideEffects: true,
      }),
    );

    expect(result.current.graphSelection.edges).toStrictEqual([
      edgeId1,
      edgeId2,
    ]);
  });

  test("should auto-open details when selecting single vertex", () => {
    const { result } = renderHookWithState(
      () => ({
        selection: useGraphSelection(),
        sidebar: useGraphViewSidebar(),
      }),
      stateWithSearchTabAndAutoOpen(),
    );

    const vertexId = createRandomVertexId();

    act(() =>
      result.current.selection.replaceGraphSelection({
        vertices: [vertexId],
      }),
    );

    expect(result.current.sidebar.activeSidebarItem).toBe("details");
  });

  test("should auto-open details when selecting single edge", () => {
    const { result } = renderHookWithState(
      () => ({
        selection: useGraphSelection(),
        sidebar: useGraphViewSidebar(),
      }),
      stateWithSearchTabAndAutoOpen(),
    );

    const edgeId = createRandomEdgeId();

    act(() =>
      result.current.selection.replaceGraphSelection({
        edges: [edgeId],
      }),
    );

    expect(result.current.sidebar.activeSidebarItem).toBe("details");
  });

  test("should not auto-open details when selecting multiple entities", () => {
    const { result } = renderHookWithState(
      () => ({
        selection: useGraphSelection(),
        sidebar: useGraphViewSidebar(),
      }),
      stateWithSearchTabAndAutoOpen(),
    );

    const vertexId1 = createRandomVertexId();
    const vertexId2 = createRandomVertexId();

    act(() =>
      result.current.selection.replaceGraphSelection({
        vertices: [vertexId1, vertexId2],
      }),
    );

    expect(result.current.sidebar.activeSidebarItem).toBe("search");
  });

  test("should not auto-open details when disableSideEffects is true", () => {
    const { result } = renderHookWithState(
      () => ({
        selection: useGraphSelection(),
        sidebar: useGraphViewSidebar(),
      }),
      stateWithSearchTabAndAutoOpen(),
    );

    const vertexId = createRandomVertexId();

    act(() =>
      result.current.selection.replaceGraphSelection({
        vertices: [vertexId],
        disableSideEffects: true,
      }),
    );

    expect(result.current.sidebar.activeSidebarItem).toBe("search");
  });

  test("should not auto-open details when clearing selection", () => {
    const { result } = renderHookWithState(
      () => ({
        selection: useGraphSelection(),
        sidebar: useGraphViewSidebar(),
      }),
      stateWithSearchTabAndAutoOpen(),
    );

    act(() =>
      result.current.selection.replaceGraphSelection({
        vertices: [],
        edges: [],
      }),
    );

    expect(result.current.sidebar.activeSidebarItem).toBe("search");
  });

  test("isVertexSelected should return true for selected vertex", () => {
    const { result } = renderHookWithState(() => useGraphSelection());

    const vertexId = createRandomVertexId();

    act(() =>
      result.current.replaceGraphSelection({
        vertices: [vertexId],
        disableSideEffects: true,
      }),
    );

    expect(result.current.graphSelection.isVertexSelected(vertexId)).toBe(true);
  });

  test("isVertexSelected should return false for unselected vertex", () => {
    const { result } = renderHookWithState(() => useGraphSelection());

    const selectedVertexId = createRandomVertexId();
    const unselectedVertexId = createRandomVertexId();

    act(() =>
      result.current.replaceGraphSelection({
        vertices: [selectedVertexId],
        disableSideEffects: true,
      }),
    );

    expect(
      result.current.graphSelection.isVertexSelected(unselectedVertexId),
    ).toBe(false);
  });

  test("isEdgeSelected should return true for selected edge", () => {
    const { result } = renderHookWithState(() => useGraphSelection());

    const edgeId = createRandomEdgeId();

    act(() =>
      result.current.replaceGraphSelection({
        edges: [edgeId],
        disableSideEffects: true,
      }),
    );

    expect(result.current.graphSelection.isEdgeSelected(edgeId)).toBe(true);
  });

  test("isEdgeSelected should return false for unselected edge", () => {
    const { result } = renderHookWithState(() => useGraphSelection());

    const selectedEdgeId = createRandomEdgeId();
    const unselectedEdgeId = createRandomEdgeId();

    act(() =>
      result.current.replaceGraphSelection({
        edges: [selectedEdgeId],
        disableSideEffects: true,
      }),
    );

    expect(result.current.graphSelection.isEdgeSelected(unselectedEdgeId)).toBe(
      false,
    );
  });
});
