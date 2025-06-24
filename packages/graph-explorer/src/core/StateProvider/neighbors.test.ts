import { createVertexId } from "@/core";
import { calculateNeighbors, useNeighbors } from "./neighbors";
import {
  createRandomVertex,
  DbState,
  renderHookWithState,
} from "@/utils/testing";
import { NeighborCountsQueryResponse } from "@/connector";
import { waitFor } from "@testing-library/react";

describe("calculateNeighbors", () => {
  it("should calculate neighbors correctly", () => {
    const total = {
      total: 10,
      byType: new Map([
        ["type1", 6],
        ["type2", 4],
      ]),
    };
    const fetchedNeighbors = [
      { id: createVertexId("1"), types: ["type1"] },
      { id: createVertexId("2"), types: ["type2"] },
      { id: createVertexId("3"), types: ["type1"] },
      { id: createVertexId("4"), types: ["type2"] },
    ];

    const result = calculateNeighbors(
      total.total,
      total.byType,
      fetchedNeighbors
    );

    expect(result.all).toEqual(total.total);
    expect(result.fetched).toEqual(4);
    expect(result.unfetched).toEqual(6);
    expect(result.byType).toEqual(
      new Map([
        ["type1", { all: 6, fetched: 2, unfetched: 4 }],
        ["type2", { all: 4, fetched: 2, unfetched: 2 }],
      ])
    );
  });
});

describe("useNeighbors", () => {
  it("should return default neighbors if no neighbors are found", () => {
    const dbState = new DbState();
    const vertex = createRandomVertex();

    const { result } = renderHookWithState(
      () => useNeighbors(vertex.id),
      dbState
    );

    expect(result.current).toEqual({
      all: 0,
      fetched: 0,
      unfetched: 0,
      byType: new Map(),
    });
  });

  it("should return neighbor counts from query", async () => {
    const dbState = new DbState();
    const vertex = createRandomVertex();

    const response: NeighborCountsQueryResponse = {
      nodeId: vertex.id,
      totalCount: 8,
      counts: { nodeType1: 5, nodeType2: 3 },
    };
    vi.mocked(dbState.explorer.fetchNeighborsCount).mockResolvedValueOnce(
      response
    );

    const { result } = renderHookWithState(
      () => useNeighbors(vertex.id),
      dbState
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        all: 8,
        fetched: 0,
        unfetched: 8,
        byType: new Map([
          ["nodeType1", { all: 5, fetched: 0, unfetched: 5 }],
          ["nodeType2", { all: 3, fetched: 0, unfetched: 3 }],
        ]),
      });
    });
  });
});
