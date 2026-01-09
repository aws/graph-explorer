import { act } from "react";
import useFiltersConfig from "./useFiltersConfig";
import { DbState, renderHookWithState } from "@/utils/testing";
import { sample } from "lodash";
import { vi } from "vitest";
import { createEdgeType, createVertexType } from "@/core";

describe("useFiltersConfig", () => {
  let dbState = new DbState();

  beforeEach(() => {
    dbState = new DbState();
    vi.resetAllMocks();
  });

  /** Creates a config with the schema and makes it active, then renders the `useFiltersConfig` hook. */
  function renderFilterConfigHook() {
    return renderHookWithState(() => useFiltersConfig(), dbState);
  }

  it("should have all entities selected", () => {
    dbState.activeSchema.vertices = [
      { type: createVertexType("Person"), attributes: [] },
      { type: createVertexType("Movie"), attributes: [] },
    ];
    dbState.activeSchema.edges = [
      { type: createEdgeType("ACTED_IN"), attributes: [] },
    ];
    const { result } = renderFilterConfigHook();

    expect(result.current.selectedVertexTypes).toEqual(
      new Set([createVertexType("Person"), createVertexType("Movie")]),
    );
    expect(result.current.selectedConnectionTypes).toEqual(
      new Set([createEdgeType("ACTED_IN")]),
    );
  });

  it("should have all vertices in checkboxes", () => {
    const expectedCheckboxIds = dbState.activeSchema.vertices.map(v => v.type);

    const { result } = renderFilterConfigHook();

    expect(result.current.vertexTypes.map(vt => vt.id)).toEqual(
      expect.arrayContaining(expectedCheckboxIds),
    );
  });

  it("should sort checkboxes alphabetically", () => {
    dbState.activeSchema.vertices = [
      { type: createVertexType("Person"), attributes: [] },
      { type: createVertexType("Movie"), attributes: [] },
    ];
    dbState.activeSchema.edges = [
      { type: createEdgeType("DIRECTED"), attributes: [] },
      { type: createEdgeType("ACTED_IN"), attributes: [] },
    ];
    const { result } = renderFilterConfigHook();

    expect(result.current.vertexTypes.map(vt => vt.text as string)).toEqual([
      "Movie",
      "Person",
    ]);
    expect(result.current.connectionTypes.map(vt => vt.text as string)).toEqual(
      ["ACTED_IN", "DIRECTED"],
    );
  });

  it("should have all edges in checkboxes", () => {
    const expectedCheckboxIds = dbState.activeSchema.edges.map(v => v.type);

    const { result } = renderFilterConfigHook();

    expect(result.current.connectionTypes.map(vt => vt.id)).toEqual(
      expect.arrayContaining(expectedCheckboxIds),
    );
  });

  it("should unselect vertex when toggled", () => {
    const changingVertex = sample(dbState.activeSchema.vertices)!;

    const { result } = renderFilterConfigHook();

    // Ensure vertex is selected initially
    expect(result.current.selectedVertexTypes.has(changingVertex.type)).toEqual(
      true,
    );

    // Deselect vertex
    act(() => result.current.onChangeVertexTypes(changingVertex.type, false));

    // Ensure vertex is no longer selected
    expect(result.current.selectedVertexTypes.has(changingVertex.type)).toEqual(
      false,
    );
  });

  it("should unselect edge when toggled", () => {
    const changingEdge = sample(dbState.activeSchema.edges)!;

    const { result } = renderFilterConfigHook();

    // Ensure edge is selected initially
    expect(
      result.current.selectedConnectionTypes.has(changingEdge.type),
    ).toEqual(true);

    // Deselect edge
    act(() => result.current.onChangeConnectionTypes(changingEdge.type, false));

    // Ensure edge is no longer selected
    expect(
      result.current.selectedConnectionTypes.has(changingEdge.type),
    ).toEqual(false);
  });
});
