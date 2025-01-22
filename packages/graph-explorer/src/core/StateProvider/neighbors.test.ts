import { VertexId } from "@/@types/entities";
import { calculateNeighbors, useNeighbors } from "./neighbors";
import {
  createRandomVertex,
  DbState,
  renderHookWithRecoilRoot,
} from "@/utils/testing";
import { explorerForTestingAtom } from "../connector";
import { createMockExplorer } from "@/utils/testing/createMockExplorer";
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
      { id: "1" as VertexId, type: "type1" },
      { id: "2" as VertexId, type: "type2" },
      { id: "3" as VertexId, type: "type1" },
      { id: "4" as VertexId, type: "type2" },
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
    const explorer = createMockExplorer();

    const { result } = renderHookWithRecoilRoot(
      () => useNeighbors(vertex),
      snapshot => {
        dbState.applyTo(snapshot);
        snapshot.set(explorerForTestingAtom, explorer);
      }
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

    const explorer = createMockExplorer();
    const response: NeighborCountsQueryResponse = {
      nodeId: vertex.id,
      totalCount: 8,
      counts: { nodeType1: 5, nodeType2: 3 },
    };
    vi.mocked(explorer.fetchNeighborsCount).mockResolvedValueOnce(response);

    const { result } = renderHookWithRecoilRoot(
      () => useNeighbors(vertex),
      snapshot => {
        dbState.applyTo(snapshot);
        snapshot.set(explorerForTestingAtom, explorer);
      }
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