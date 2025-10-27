import { createRandomVertex, FakeExplorer } from "@/utils/testing";
import { bulkNeighborCountsQuery } from "./bulkNeighborCountsQuery";
import { neighborsCountQuery } from "./neighborsCountQuery";
import type { NeighborCount } from "../useGEFetchTypes";
import { createQueryClient } from "@/core/queryClient";
import { createArray } from "@shared/utils/testing";
import { DEFAULT_BATCH_REQUEST_SIZE } from "@/utils";

describe("bulkNeighborCountsQuery", () => {
  it("should return nothing when input is empty", async () => {
    const explorer = new FakeExplorer();
    const bulkNeighborCountsSpy = vi.spyOn(explorer, "neighborCounts");
    const queryClient = createQueryClient({ explorer });

    const result = await queryClient.fetchQuery(
      bulkNeighborCountsQuery([], queryClient)
    );

    expect(result).toEqual([]);
    expect(bulkNeighborCountsSpy).toBeCalledTimes(0);
  });

  it("should return cached when input is cached", async () => {
    const explorer = new FakeExplorer();
    const bulkNeighborCountsSpy = vi.spyOn(explorer, "neighborCounts");
    const queryClient = createQueryClient({ explorer });

    const vertex = createRandomVertex();

    // Add counts to cache
    const cachedResponse: NeighborCount = {
      vertexId: vertex.id,
      counts: { inCount: 1, outCount: 2 },
      totalCount: 3,
    };
    queryClient.setQueryData(
      neighborsCountQuery(vertex.id).queryKey,
      cachedResponse
    );

    const result = await queryClient.fetchQuery(
      bulkNeighborCountsQuery([vertex.id], queryClient)
    );

    expect(result).toEqual([cachedResponse]);
    expect(bulkNeighborCountsSpy).toBeCalledTimes(0);

    // Ensure counts are still in the cache
    expect(
      queryClient.getQueryData(neighborsCountQuery(vertex.id).queryKey)
    ).toEqual(cachedResponse);
  });

  it("should fetch counts for input", async () => {
    const explorer = new FakeExplorer();
    const bulkNeighborCountsSpy = vi.spyOn(explorer, "neighborCounts");
    const queryClient = createQueryClient({ explorer });

    const vertex = createRandomVertex();
    const expected: NeighborCount = {
      vertexId: vertex.id,
      counts: { inCount: 1, outCount: 2 },
      totalCount: 3,
    };

    // Mock fetch response
    bulkNeighborCountsSpy.mockResolvedValueOnce({
      counts: [expected],
    });

    const result = await queryClient.fetchQuery(
      bulkNeighborCountsQuery([vertex.id], queryClient)
    );

    expect(result).toEqual([expected]);
    expect(bulkNeighborCountsSpy).toBeCalledTimes(1);

    // Ensure counts are added to the cache
    expect(
      queryClient.getQueryData(neighborsCountQuery(vertex.id).queryKey)
    ).toEqual(expected);
  });

  it("should combine cached and fetched", async () => {
    const explorer = new FakeExplorer();
    const bulkNeighborCountsSpy = vi.spyOn(explorer, "neighborCounts");
    const queryClient = createQueryClient({ explorer });

    // Add counts to cache
    const vertexCached = createRandomVertex();
    const cachedResponse: NeighborCount = {
      vertexId: vertexCached.id,
      counts: { inCount: 1, outCount: 2 },
      totalCount: 3,
    };
    queryClient.setQueryData(
      neighborsCountQuery(vertexCached.id).queryKey,
      cachedResponse
    );

    // Mock fetch response
    const vertexFetched = createRandomVertex();
    const fetchedResponse: NeighborCount = {
      vertexId: vertexFetched.id,
      counts: { inCount: 1, outCount: 2 },
      totalCount: 3,
    };
    bulkNeighborCountsSpy.mockResolvedValueOnce({
      counts: [fetchedResponse],
    });

    const result = await queryClient.fetchQuery(
      bulkNeighborCountsQuery([vertexCached.id, vertexFetched.id], queryClient)
    );

    expect(result).toEqual([cachedResponse, fetchedResponse]);
    expect(bulkNeighborCountsSpy).toBeCalledTimes(1);

    // Ensure counts are added to the cache
    expect(
      queryClient.getQueryData(neighborsCountQuery(vertexCached.id).queryKey)
    ).toEqual(cachedResponse);
    expect(
      queryClient.getQueryData(neighborsCountQuery(vertexFetched.id).queryKey)
    ).toEqual(fetchedResponse);
  });

  it("should batch fetches for input", async () => {
    const explorer = new FakeExplorer();
    const bulkNeighborCountsSpy = vi.spyOn(explorer, "neighborCounts");
    const queryClient = createQueryClient({ explorer });

    const vertices = createArray(
      // 3 full batches plus 1 additional, to make 4
      DEFAULT_BATCH_REQUEST_SIZE * 3 + 1,
      createRandomVertex
    );

    const expected = vertices.map(v => ({
      vertexId: v.id,
      counts: { inCount: 1, outCount: 2 },
      totalCount: 3,
    }));

    bulkNeighborCountsSpy.mockImplementation(request =>
      Promise.resolve({
        counts: request.vertexIds.map(vertexId => ({
          vertexId,
          counts: { inCount: 1, outCount: 2 },
          totalCount: 3,
        })),
      })
    );

    const result = await queryClient.fetchQuery(
      bulkNeighborCountsQuery(
        vertices.map(v => v.id),
        queryClient
      )
    );

    expect(result).toHaveLength(vertices.length);
    expect(result).toEqual(expected);
    expect(bulkNeighborCountsSpy).toBeCalledTimes(4);

    // Ensure all are added to the cache
    for (const vertex of vertices) {
      expect(
        queryClient.getQueryData(neighborsCountQuery(vertex.id).queryKey)
      ).not.toBeUndefined();
    }
  });
});
