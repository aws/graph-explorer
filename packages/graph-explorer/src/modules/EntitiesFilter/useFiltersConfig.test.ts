import { act } from "react";
import useFiltersConfig from "./useFiltersConfig";
import {
  createRandomRawConfiguration,
  createRandomSchema,
  renderHookWithRecoilRoot,
} from "@/utils/testing";
import { sample } from "lodash";
import { Schema } from "@/core";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "@/core/StateProvider/configuration";
import { vi } from "vitest";

/** Creates a config with the schema and makes it active, then renders the `useFiltersConfig` hook. */
function renderFilterConfigHook(schema: Schema) {
  return renderHookWithRecoilRoot(
    () => useFiltersConfig(),
    snapshot => {
      // Initialize the configuration atom with a test config
      const config = createRandomRawConfiguration();
      config.schema = schema;
      snapshot.set(configurationAtom, new Map([[config.id, config]]));
      snapshot.set(activeConfigurationAtom, config.id);
    }
  );
}

describe("useFiltersConfig", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should have all entities selected", () => {
    const schema = createRandomSchema();

    const { result } = renderFilterConfigHook(schema);

    expect(result.current.selectedVertexTypes).toEqual(
      new Set(schema.vertices.map(v => v.type))
    );
    expect(result.current.selectedConnectionTypes).toEqual(
      new Set(schema.edges.map(v => v.type))
    );
  });

  it("should have all vertices in checkboxes", () => {
    const schema = createRandomSchema();
    const expectedCheckboxIds = schema.vertices.map(v => v.type);

    const { result } = renderFilterConfigHook(schema);

    expect(result.current.vertexTypes.map(vt => vt.id)).toEqual(
      expect.arrayContaining(expectedCheckboxIds)
    );
  });

  it("should sort vertex checkboxes alphabetically", () => {
    const schema = createRandomSchema();

    const { result } = renderFilterConfigHook(schema);

    const actualVertexTypes = result.current.vertexTypes.map(
      vt => vt.text as string
    );
    const sortedExpectations = result.current.vertexTypes
      .map(vt => vt.text as string)
      .toSorted((a, b) => a.localeCompare(b));

    expect(actualVertexTypes).toEqual(sortedExpectations);
  });

  it("should have all edges in checkboxes", () => {
    const schema = createRandomSchema();
    const expectedCheckboxIds = schema.edges.map(v => v.type);

    const { result } = renderFilterConfigHook(schema);

    expect(result.current.connectionTypes.map(vt => vt.id)).toEqual(
      expect.arrayContaining(expectedCheckboxIds)
    );
  });

  it("should sort edge checkboxes alphabetically", () => {
    const schema = createRandomSchema();

    const { result } = renderFilterConfigHook(schema);

    const actualConnectionTypes = result.current.connectionTypes.map(
      et => et.text as string
    );
    const expectedConnectionTypes = actualConnectionTypes.toSorted((a, b) =>
      a.localeCompare(b)
    );
    expect(actualConnectionTypes).toEqual(expectedConnectionTypes);
  });

  it("should unselect vertex when toggled", () => {
    const schema = createRandomSchema();
    const changingVertex = sample(schema.vertices)!;

    const { result } = renderFilterConfigHook(schema);

    // Ensure vertex is selected initially
    expect(result.current.selectedVertexTypes.has(changingVertex.type)).toEqual(
      true
    );

    // Deselect vertex
    act(() => result.current.onChangeVertexTypes(changingVertex.type, false));

    // Ensure vertex is no longer selected
    expect(result.current.selectedVertexTypes.has(changingVertex.type)).toEqual(
      false
    );
  });

  it("should unselect edge when toggled", () => {
    const schema = createRandomSchema();
    const changingEdge = sample(schema.edges)!;

    const { result } = renderFilterConfigHook(schema);

    // Ensure edge is selected initially
    expect(
      result.current.selectedConnectionTypes.has(changingEdge.type)
    ).toEqual(true);

    // Deselect edge
    act(() => result.current.onChangeConnectionTypes(changingEdge.type, false));

    // Ensure edge is no longer selected
    expect(
      result.current.selectedConnectionTypes.has(changingEdge.type)
    ).toEqual(false);
  });
});
