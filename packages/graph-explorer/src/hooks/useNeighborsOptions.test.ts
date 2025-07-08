import useNeighborsOptions from "./useNeighborsOptions";
import {
  createRandomEdge,
  createRandomVertex,
  DbState,
  renderHookWithState,
} from "@/utils/testing";
import { NeighborCountsResponse } from "@/connector";
import { waitFor } from "@testing-library/react";

describe("useNeighborsOptions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return an empty list when no response", () => {
    const dbState = new DbState();
    const vertex = createRandomVertex();

    const { result } = renderHookWithState(
      () => useNeighborsOptions(vertex.id),
      dbState
    );

    expect(result.current).toHaveLength(0);
  });

  it("should return an empty list when response is empty", () => {
    const dbState = new DbState();
    const vertex = createRandomVertex();

    const response: NeighborCountsResponse = {
      vertexId: vertex.id,
      totalCount: 0,
      counts: {},
    };
    vi.mocked(dbState.explorer.fetchNeighborsCount).mockResolvedValueOnce(
      response
    );

    const { result } = renderHookWithState(
      () => useNeighborsOptions(vertex.id),
      dbState
    );

    expect(result.current).toHaveLength(0);
  });

  it("should return list of neighbor types", async () => {
    const dbState = new DbState();
    const vertex = createRandomVertex();
    dbState.addVertexToGraph(vertex);

    const response: NeighborCountsResponse = {
      vertexId: vertex.id,
      totalCount: 8,
      counts: { nodeType1: 5, nodeType2: 3 },
    };
    vi.mocked(dbState.explorer.fetchNeighborsCount).mockResolvedValueOnce(
      response
    );

    const { result } = renderHookWithState(
      () => useNeighborsOptions(vertex.id),
      dbState
    );

    await waitFor(() => {
      expect(dbState.explorer.fetchNeighborsCount).toHaveBeenCalledTimes(1);
      expect(result.current).toHaveLength(2);

      const firstResult = result.current[0];
      expect(firstResult.label).toEqual("nodeType1");
      expect(firstResult.value).toEqual("nodeType1");
      expect(firstResult.isDisabled).toEqual(false);

      const secondResult = result.current[1];
      expect(secondResult.label).toEqual("nodeType2");
      expect(secondResult.value).toEqual("nodeType2");
      expect(secondResult.isDisabled).toEqual(false);
    });
  });

  it("should disable neighbor when all neighbors in graph already", async () => {
    const dbState = new DbState();

    // Add source and neighbor vertex to graph
    const vertex = createRandomVertex();
    dbState.addVertexToGraph(vertex);

    const neighbor = createRandomVertex();
    neighbor.type = "nodeType1";
    neighbor.types = ["nodeType1"];
    dbState.addVertexToGraph(neighbor);

    const edge = createRandomEdge(vertex, neighbor);
    dbState.addEdgeToGraph(edge);

    const response: NeighborCountsResponse = {
      vertexId: vertex.id,
      totalCount: 1,
      counts: { nodeType1: 1 },
    };
    vi.mocked(dbState.explorer.fetchNeighborsCount).mockResolvedValueOnce(
      response
    );

    const { result } = renderHookWithState(
      () => useNeighborsOptions(vertex.id),
      dbState
    );

    await waitFor(() => {
      expect(dbState.explorer.fetchNeighborsCount).toHaveBeenCalledTimes(1);
      expect(result.current).toHaveLength(1);

      const firstResult = result.current[0];
      expect(firstResult.label).toEqual("nodeType1");
      expect(firstResult.value).toEqual("nodeType1");
      expect(firstResult.isDisabled).toEqual(true);
    });
  });
});
