import { describe, expect, it } from "vitest";

import { createResultScalar } from "@/connector/entities";
import {
  createEdgeId,
  createEdgeType,
  createVertexId,
  type DisplayAttribute,
  type DisplayEdge,
} from "@/core";
import { DbState, renderHookWithState } from "@/utils/testing";

import { useEdgeAttributesAsScalars } from "./useEdgeAttributesAsScalars";

describe("useEdgeAttributesAsScalars", () => {
  let dbState = new DbState();

  const edge: DisplayEdge = {
    entityType: "edge",
    id: createEdgeId("edge-1"),
    type: createEdgeType("knows"),
    displayId: "edge-1",
    displayName: "knows",
    displayTypes: "knows",
    sourceId: createVertexId("vertex-1"),
    targetId: createVertexId("vertex-2"),
    attributes: [
      {
        name: "since",
        displayLabel: "Since",
        displayValue: "2020",
      },
      {
        name: "weight",
        displayLabel: "Weight",
        displayValue: "0.8",
      },
    ] as DisplayAttribute[],
    hasUniqueId: true,
  };

  beforeEach(() => {
    // Start with a fresh state for each test
    dbState = new DbState();
  });

  describe("Gremlin", () => {
    beforeEach(() => {
      dbState.activeConfig.connection!.queryEngine = "gremlin";
    });

    it("should return ID, Edge Label, and attributes for edge with unique ID", () => {
      const { result } = renderHookWithState(
        () => useEdgeAttributesAsScalars(edge),
        dbState,
      );

      const scalars = result.current;
      expect(scalars).toHaveLength(4); // ID + Edge Label + 2 attributes

      expect(scalars[0]).toEqual(
        createResultScalar({
          name: "ID",
          value: "edge-1",
        }),
      );

      expect(scalars[1]).toEqual(
        createResultScalar({
          name: "Edge Label",
          value: "knows",
        }),
      );

      expect(scalars[2]).toEqual(
        createResultScalar({
          name: "Since",
          value: "2020",
        }),
      );

      expect(scalars[3]).toEqual(
        createResultScalar({
          name: "Weight",
          value: "0.8",
        }),
      );
    });

    it("should not include ID for edge without unique ID", () => {
      const edgeWithoutId = {
        ...edge,
        hasUniqueId: false,
      };

      const { result } = renderHookWithState(
        () => useEdgeAttributesAsScalars(edgeWithoutId),
        dbState,
      );

      const scalars = result.current;
      expect(scalars).toHaveLength(3); // Edge Label + 2 attributes (no ID)

      expect(scalars[0]).toEqual(
        createResultScalar({
          name: "Edge Label",
          value: "knows",
        }),
      );
    });
  });

  describe("openCypher", () => {
    beforeEach(() => {
      dbState.activeConfig.connection!.queryEngine = "openCypher";
    });

    it("should return ID, Relationship Type, and attributes for edge with unique ID", () => {
      const { result } = renderHookWithState(
        () => useEdgeAttributesAsScalars(edge),
        dbState,
      );

      const scalars = result.current;
      expect(scalars).toHaveLength(4); // ID + Relationship Type + 2 attributes

      expect(scalars[0]).toEqual(
        createResultScalar({
          name: "ID",
          value: "edge-1",
        }),
      );

      expect(scalars[1]).toEqual(
        createResultScalar({
          name: "Relationship Type",
          value: "knows",
        }),
      );

      expect(scalars[2]).toEqual(
        createResultScalar({
          name: "Since",
          value: "2020",
        }),
      );

      expect(scalars[3]).toEqual(
        createResultScalar({
          name: "Weight",
          value: "0.8",
        }),
      );
    });

    it("should not include ID for edge without unique ID", () => {
      const edgeWithoutId = {
        ...edge,
        hasUniqueId: false,
      };

      const { result } = renderHookWithState(
        () => useEdgeAttributesAsScalars(edgeWithoutId),
        dbState,
      );

      const scalars = result.current;
      expect(scalars).toHaveLength(3); // Relationship Type + 2 attributes (no ID)

      expect(scalars[0]).toEqual(
        createResultScalar({
          name: "Relationship Type",
          value: "knows",
        }),
      );
    });
  });

  describe("SPARQL", () => {
    beforeEach(() => {
      dbState.activeConfig.connection!.queryEngine = "sparql";
    });
    it("should return ID, Predicate and attributes for edge with unique ID", () => {
      const { result } = renderHookWithState(
        () => useEdgeAttributesAsScalars(edge),
        dbState,
      );

      const scalars = result.current;
      expect(scalars).toHaveLength(4); // ID + Predicate + 2 attributes

      expect(scalars[0]).toEqual(
        createResultScalar({
          name: "ID",
          value: "edge-1",
        }),
      );

      expect(scalars[1]).toEqual(
        createResultScalar({
          name: "Predicate",
          value: "knows",
        }),
      );

      expect(scalars[2]).toEqual(
        createResultScalar({
          name: "Since",
          value: "2020",
        }),
      );

      expect(scalars[3]).toEqual(
        createResultScalar({
          name: "Weight",
          value: "0.8",
        }),
      );
    });

    it("should not include ID when hasUniqueId is false", () => {
      const edgeWithoutId = {
        ...edge,
        hasUniqueId: false,
      };

      const { result } = renderHookWithState(
        () => useEdgeAttributesAsScalars(edgeWithoutId),
        dbState,
      );

      const scalars = result.current;
      expect(scalars).toHaveLength(3); // Predicate + 2 attributes (no ID)
      expect(scalars.find(s => s.name === "ID")).toBeUndefined();
    });
  });

  it("should handle edge with no attributes", () => {
    const edgeWithNoAttributes = {
      ...edge,
      attributes: [],
    };

    const { result } = renderHookWithState(
      () => useEdgeAttributesAsScalars(edgeWithNoAttributes),
      dbState,
    );

    const scalars = result.current;
    expect(scalars).toHaveLength(2); // Only ID and Label
  });
});
