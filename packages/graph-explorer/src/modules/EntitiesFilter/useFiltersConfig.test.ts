import { expect, jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react-hooks";
import useFiltersConfig from "./useFiltersConfig";
import { useTestSchema } from "../../utils/testing/useTestSchema";
import { createRandomSchema } from "../../utils/testing/randomData";
import { TestableRootProviders } from "../../utils/testing/TestableRootProviders";
import { sample, sortBy } from "lodash";
import { Schema } from "../../core";

jest.mock("localforage", () => ({
  config: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

/** Creates a config with the schema and makes it active, then renders the `useFiltersConfig` hook. */
function renderFilterConfigHook(schema: Schema) {
  return renderHook(
    () => {
      useTestSchema(schema);
      return useFiltersConfig();
    },
    {
      wrapper: TestableRootProviders,
    }
  );
}

describe("useFiltersConfig", () => {
  beforeEach(() => {
    jest.resetAllMocks();
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

    expect(result.current.vertexTypes).toEqual(
      sortBy(result.current.vertexTypes, vt => vt.text)
    );
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

    expect(result.current.connectionTypes).toEqual(
      sortBy(result.current.connectionTypes, vt => vt.text)
    );
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
    act(() => {
      result.current.onChangeVertexTypes(changingVertex.type, false);
    });

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
    act(() => {
      result.current.onChangeConnectionTypes(changingEdge.type, false);
    });

    // Ensure edge is no longer selected
    expect(
      result.current.selectedConnectionTypes.has(changingEdge.type)
    ).toEqual(false);
  });
});
