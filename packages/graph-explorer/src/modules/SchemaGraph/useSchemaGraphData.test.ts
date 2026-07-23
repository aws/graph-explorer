// @vitest-environment happy-dom
import { act } from "react";

import { createEdgeType, createVertexType, useHiddenSchemaTypes } from "@/core";
import {
  createTestableVertex,
  DbState,
  renderHookWithState,
} from "@/utils/testing";

import { useSchemaGraphData } from "./useSchemaGraphData";

describe("useSchemaGraphData", () => {
  it("excludes hidden vertex types from the nodes", () => {
    const state = new DbState();
    state.activeSchema.vertices = [];
    state.addTestableVertexToGraph(
      createTestableVertex().with({ types: ["Airport"] }),
    );
    state.addTestableVertexToGraph(
      createTestableVertex().with({ types: ["City"] }),
    );

    const { result } = renderHookWithState(
      () => ({
        data: useSchemaGraphData(),
        hidden: useHiddenSchemaTypes(),
      }),
      state,
    );

    expect(
      result.current.data.nodes.map(n => n.data.type).toSorted(),
    ).toStrictEqual([createVertexType("Airport"), createVertexType("City")]);

    act(() => result.current.hidden.toggleType(createVertexType("Airport")));

    expect(result.current.data.nodes.map(n => n.data.type)).toStrictEqual([
      createVertexType("City"),
    ]);
  });

  it("drops edges whose endpoint vertex type is hidden", () => {
    const state = new DbState();
    state.addTestableVertexToGraph(
      createTestableVertex().with({ types: ["Airport"] }),
    );
    state.addTestableVertexToGraph(
      createTestableVertex().with({ types: ["City"] }),
    );
    state.activeSchema.edgeConnections = [
      {
        edgeType: createEdgeType("locatedIn"),
        sourceVertexType: createVertexType("Airport"),
        targetVertexType: createVertexType("City"),
      },
    ];

    const { result } = renderHookWithState(
      () => ({
        data: useSchemaGraphData(),
        hidden: useHiddenSchemaTypes(),
      }),
      state,
    );

    expect(result.current.data.edges).toHaveLength(1);

    act(() => result.current.hidden.toggleType(createVertexType("City")));

    expect(result.current.data.edges).toHaveLength(0);
  });
});
