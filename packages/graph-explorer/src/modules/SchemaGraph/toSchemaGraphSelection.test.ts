import { createEdgeType, createVertexType } from "@/core";
import { createEdgeConnectionId } from "@/core/StateProvider/edgeConnectionId";

import {
  shouldAutoOpenDetailsForSelection,
  toSchemaGraphSelection,
  toSelectedElements,
} from "./SchemaGraph";

function createSelectedElements(
  nodeIds: string[] = [],
  edgeIds: string[] = [],
) {
  return {
    nodeIds: new Set(nodeIds),
    edgeIds: new Set(edgeIds),
    groupIds: new Set<string>(),
  };
}

describe("toSchemaGraphSelection", () => {
  test("returns null when nothing is selected", () => {
    const result = toSchemaGraphSelection(createSelectedElements());
    expect(result).toBeNull();
  });

  test("returns a single vertex-type selection", () => {
    const result = toSchemaGraphSelection(createSelectedElements(["Person"]));
    expect(result).toStrictEqual({
      type: "vertex-type",
      id: createVertexType("Person"),
    });
  });

  test("returns a single edge-connection selection", () => {
    const edgeId = createEdgeConnectionId({
      sourceVertexType: createVertexType("Person"),
      edgeType: createEdgeType("knows"),
      targetVertexType: createVertexType("Person"),
    });

    const result = toSchemaGraphSelection(createSelectedElements([], [edgeId]));
    expect(result).toStrictEqual({
      type: "edge-connection",
      id: edgeId,
    });
  });

  test("returns multiple selection for two nodes", () => {
    const result = toSchemaGraphSelection(
      createSelectedElements(["Person", "Company"]),
    );
    expect(result).toStrictEqual({
      type: "multiple",
      items: [
        { type: "vertex-type", id: createVertexType("Person") },
        { type: "vertex-type", id: createVertexType("Company") },
      ],
    });
  });

  test("returns multiple selection for a node and an edge", () => {
    const edgeId = createEdgeConnectionId({
      sourceVertexType: createVertexType("Person"),
      edgeType: createEdgeType("worksAt"),
      targetVertexType: createVertexType("Company"),
    });

    const result = toSchemaGraphSelection(
      createSelectedElements(["Person"], [edgeId]),
    );
    expect(result).toStrictEqual({
      type: "multiple",
      items: [
        { type: "vertex-type", id: createVertexType("Person") },
        { type: "edge-connection", id: edgeId },
      ],
    });
  });
});

describe("shouldAutoOpenDetailsForSelection", () => {
  test("returns false for a null (cleared) selection", () => {
    expect(shouldAutoOpenDetailsForSelection(null)).toBe(false);
  });

  test("returns true for a single vertex-type selection", () => {
    expect(
      shouldAutoOpenDetailsForSelection({
        type: "vertex-type",
        id: createVertexType("Person"),
      }),
    ).toBe(true);
  });

  test("returns true for a single edge-connection selection", () => {
    const edgeId = createEdgeConnectionId({
      sourceVertexType: createVertexType("Person"),
      edgeType: createEdgeType("knows"),
      targetVertexType: createVertexType("Person"),
    });

    expect(
      shouldAutoOpenDetailsForSelection({
        type: "edge-connection",
        id: edgeId,
      }),
    ).toBe(true);
  });

  test("returns false for a multiple selection", () => {
    expect(
      shouldAutoOpenDetailsForSelection({
        type: "multiple",
        items: [
          { type: "vertex-type", id: createVertexType("Person") },
          { type: "vertex-type", id: createVertexType("Company") },
        ],
      }),
    ).toBe(false);
  });
});

describe("toSelectedElements", () => {
  test("maps a vertex-type item to a single selected node", () => {
    const result = toSelectedElements({
      type: "vertex-type",
      id: createVertexType("Person"),
    });

    expect(result).toStrictEqual(createSelectedElements(["Person"]));
  });

  test("maps an edge-connection item to a single selected edge", () => {
    const edgeId = createEdgeConnectionId({
      sourceVertexType: createVertexType("Person"),
      edgeType: createEdgeType("knows"),
      targetVertexType: createVertexType("Company"),
    });

    const result = toSelectedElements({ type: "edge-connection", id: edgeId });

    expect(result).toStrictEqual(createSelectedElements([], [edgeId]));
  });
});
