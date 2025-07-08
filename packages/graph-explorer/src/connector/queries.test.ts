import {
  createRandomVertex,
  createRandomVertexId,
  FakeExplorer,
} from "@/utils/testing";
import {
  bulkNeighborCountsQuery,
  neighborsCountQuery,
  vertexDetailsQuery,
} from "./queries";
import {
  VertexDetailsResponse,
  NeighborCountsResponse,
} from "./useGEFetchTypes";
import { createQueryClient } from "@/core/queryClient";
import { createArray } from "@shared/utils/testing";
import { DEFAULT_BATCH_REQUEST_SIZE } from "@/utils";

describe("vertexDetailsQuery", () => {
  it("should return null when vertex is not found", async () => {
    const explorer = new FakeExplorer();
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const queryClient = createQueryClient({ explorer });

    const result = await queryClient.fetchQuery(
      vertexDetailsQuery(createRandomVertexId())
    );

    expect(result.vertex).toBeNull();
    expect(vertexDetailsSpy).toBeCalledTimes(1);
  });

  it("should fetch details for input", async () => {
    const explorer = new FakeExplorer();
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const queryClient = createQueryClient({ explorer });

    const vertex = createRandomVertex();
    explorer.addVertex(vertex);

    const result = await queryClient.fetchQuery(vertexDetailsQuery(vertex.id));

    expect(result.vertex).toEqual(vertex);
    expect(vertexDetailsSpy).toBeCalledTimes(1);
  });
});

describe("bulkVertexDetailsQuery", () => {
  it("should return nothing when input is empty", async () => {
    const explorer = new FakeExplorer();
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const queryClient = createQueryClient({ explorer });

    const result = await queryClient.fetchQuery(bulkVertexDetailsQuery([]));

    expect(result.vertices).toEqual([]);
    expect(vertexDetailsSpy).toBeCalledTimes(0);
  });

  it("should return cached when input is cached", async () => {
    const explorer = new FakeExplorer();
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const queryClient = createQueryClient({ explorer });

    const vertex = createRandomVertex();

    // Add vertices to cache
    queryClient.setQueryData(vertexDetailsQuery(vertex.id).queryKey, {
      vertex,
    });

    const result = await queryClient.fetchQuery(
      bulkVertexDetailsQuery([vertex.id])
    );

    expect(result.vertices).toEqual([vertex]);
    expect(vertexDetailsSpy).toBeCalledTimes(0);

    // Ensure vertex is still in the cache
    expect(
      queryClient.getQueryData(vertexDetailsQuery(vertex.id).queryKey)
    ).toEqual({ vertex });
  });

  it("should fetch details for input", async () => {
    const explorer = new FakeExplorer();
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const queryClient = createQueryClient({ explorer });

    const vertex = createRandomVertex();
    explorer.addVertex(vertex);

    const result = await queryClient.fetchQuery(
      bulkVertexDetailsQuery([vertex.id])
    );

    expect(result.vertices).toEqual([vertex]);
    expect(vertexDetailsSpy).toBeCalledTimes(1);

    // Ensure vertex is added to the cache
    expect(
      queryClient.getQueryData(vertexDetailsQuery(vertex.id).queryKey)
    ).toEqual({ vertex });
  });

  it("should combine cached and fetched results", async () => {
    const explorer = new FakeExplorer();
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const queryClient = createQueryClient({ explorer });

    const vertexCached = createRandomVertex();

    // Add vertices to cache
    queryClient.setQueryData(vertexDetailsQuery(vertexCached.id).queryKey, {
      vertex: vertexCached,
    });

    // Add vertex to explorer
    const vertexFetched = createRandomVertex();
    explorer.addVertex(vertexFetched);

    const result = await queryClient.fetchQuery(
      bulkVertexDetailsQuery([vertexCached.id, vertexFetched.id])
    );

    expect(result.vertices).toEqual([vertexCached, vertexFetched]);
    expect(vertexDetailsSpy).toBeCalledTimes(1);

    // Ensure both vertices are added to the cache
    expect(
      queryClient.getQueryData(vertexDetailsQuery(vertexCached.id).queryKey)
    ).toEqual({ vertex: vertexCached });
    expect(
      queryClient.getQueryData(vertexDetailsQuery(vertexFetched.id).queryKey)
    ).toEqual({ vertex: vertexFetched });
  });

  it("should batch fetches for input", async () => {
    const explorer = new FakeExplorer();
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const queryClient = createQueryClient({ explorer });

    const vertices = createArray(
      // 3 full batches plus 1 additional, to make 4
      DEFAULT_BATCH_REQUEST_SIZE * 3 + 1,
      createRandomVertex
    );
    vertices.forEach(v => explorer.addVertex(v));

    const result = await queryClient.fetchQuery(
      bulkVertexDetailsQuery(vertices.map(v => v.id))
    );

    expect(result.vertices).toEqual(vertices);
    expect(vertexDetailsSpy).toBeCalledTimes(4);

    // Ensure all are added to the cache
    for (const vertex of vertices) {
      expect(
        queryClient.getQueryData(vertexDetailsQuery(vertex.id).queryKey)
      ).toEqual({ vertex });
    }
  });
});

describe("bulkNeighborCountsQuery", () => {
  it("should return nothing when input is empty", async () => {
    const explorer = new FakeExplorer();
    const bulkNeighborCountsSpy = vi.spyOn(explorer, "bulkNeighborCounts");
    const queryClient = createQueryClient({ explorer });

    const result = await queryClient.fetchQuery(
      bulkNeighborCountsQuery([], queryClient)
    );

    expect(result).toEqual([]);
    expect(bulkNeighborCountsSpy).toBeCalledTimes(0);
  });

  it("should return cached when input is cached", async () => {
    const explorer = new FakeExplorer();
    const bulkNeighborCountsSpy = vi.spyOn(explorer, "bulkNeighborCounts");
    const queryClient = createQueryClient({ explorer });

    const vertex = createRandomVertex();

    // Add counts to cache
    const cachedResponse: NeighborCountsResponse = {
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
    const bulkNeighborCountsSpy = vi.spyOn(explorer, "bulkNeighborCounts");
    const queryClient = createQueryClient({ explorer });

    const vertex = createRandomVertex();
    const expected: NeighborCountsResponse = {
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
    const bulkNeighborCountsSpy = vi.spyOn(explorer, "bulkNeighborCounts");
    const queryClient = createQueryClient({ explorer });

    // Add counts to cache
    const vertexCached = createRandomVertex();
    const cachedResponse: NeighborCountsResponse = {
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
    const fetchedResponse: NeighborCountsResponse = {
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
    const bulkNeighborCountsSpy = vi.spyOn(explorer, "bulkNeighborCounts");
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
