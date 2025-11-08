import {
  type DisplayVertex,
  createVertexId,
  type DisplayAttribute,
} from "@/core";
import {
  DbState,
  createRandomQueryEngine,
  renderHookWithState,
} from "@/utils/testing";
import { useVertexAttributesAsScalars } from "./useVertexAttributesAsScalars";
import { createResultScalar } from "@/connector/entities";

describe("useVertexAttributesAsScalars", () => {
  let dbState = new DbState();

  const vertex: DisplayVertex = {
    entityType: "vertex",
    id: createVertexId("vertex-1"),
    primaryType: "Person",
    types: ["Person"],
    displayId: "vertex-1",
    displayTypes: "Person",
    displayName: "John Doe",
    displayDescription: "A person",
    typeConfig: {} as any,
    attributes: [
      {
        name: "name",
        displayLabel: "Name",
        displayValue: "John Doe",
      },
      {
        name: "age",
        displayLabel: "Age",
        displayValue: "30",
      },
    ] as DisplayAttribute[],
    isBlankNode: false,
    original: {
      types: ["Person"],
    } as any,
  };

  beforeEach(() => {
    // Start with a fresh state for each test
    dbState = new DbState();
  });

  describe("in Gremlin/OpenCypher", () => {
    beforeEach(() => {
      dbState.activeConfig.connection!.queryEngine =
        createRandomQueryEngine("pg");
    });

    it("should return ID, Label, and attributes for vertex", () => {
      const { result } = renderHookWithState(
        () => useVertexAttributesAsScalars(vertex),
        dbState
      );

      const scalars = result.current;
      expect(scalars).toHaveLength(4); // ID + Label + 2 attributes

      expect(scalars[0]).toEqual(
        createResultScalar({
          name: "Node Id",
          value: "vertex-1",
        })
      );

      expect(scalars[1]).toEqual(
        createResultScalar({
          name: "Node Label",
          value: "Person",
        })
      );

      expect(scalars[2]).toEqual(
        createResultScalar({
          name: "Name",
          value: "John Doe",
        })
      );

      expect(scalars[3]).toEqual(
        createResultScalar({
          name: "Age",
          value: "30",
        })
      );
    });
  });

  describe("SPARQL", () => {
    beforeEach(() => {
      dbState.activeConfig.connection!.queryEngine = "sparql";
    });

    it("should return URI, Class, and attributes for vertex", () => {
      const { result } = renderHookWithState(
        () => useVertexAttributesAsScalars(vertex),
        dbState
      );

      const scalars = result.current;
      expect(scalars).toHaveLength(4);

      expect(scalars[0]).toEqual(
        createResultScalar({
          name: "Resource URI",
          value: "vertex-1",
        })
      );

      expect(scalars[1]).toEqual(
        createResultScalar({
          name: "Class",
          value: "Person",
        })
      );
    });

    it("should use 'Blank node ID' for blank nodes", () => {
      const blankNodeVertex = {
        ...vertex,
        isBlankNode: true,
        original: {
          types: ["Person"],
        } as any,
      };

      const { result } = renderHookWithState(
        () => useVertexAttributesAsScalars(blankNodeVertex),
        dbState
      );

      const scalars = result.current;
      expect(scalars[0]).toEqual(
        createResultScalar({
          name: "Blank Node Id",
          value: "vertex-1",
        })
      );
    });
  });

  it("should handle vertex with no attributes", () => {
    const vertexWithNoAttributes = {
      ...vertex,
      attributes: [],
      original: {
        types: ["Person"],
      } as any,
    };

    const { result } = renderHookWithState(
      () => useVertexAttributesAsScalars(vertexWithNoAttributes),
      dbState
    );

    const scalars = result.current;
    expect(scalars).toHaveLength(2); // Only ID and Label
  });

  it("should handle empty displayTypes", () => {
    dbState.activeConfig.connection!.queryEngine = "openCypher";

    const vertexWithEmptyTypes: DisplayVertex = {
      entityType: "vertex",
      id: createVertexId("vertex-1"),
      primaryType: "",
      types: [],
      displayId: "vertex-1",
      displayTypes: "",
      displayName: "John Doe",
      displayDescription: "A person",
      typeConfig: {} as any,
      attributes: [],
      isBlankNode: false,
      original: { types: [] } as any,
    };

    const { result } = renderHookWithState(
      () => useVertexAttributesAsScalars(vertexWithEmptyTypes),
      dbState
    );

    const scalars = result.current;
    expect(scalars[1]).toEqual(
      createResultScalar({
        name: "Node Label",
        value: "",
      })
    );
  });
});
