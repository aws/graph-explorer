import { createRandomVertex, DbState } from "@/utils/testing";
import { bulkVertexDetailsQuery, vertexDetailsQuery } from "./queries";
import { VertexDetailsResponse } from "./useGEFetchTypes";
import { createQueryClient } from "@/core/queryClient";
import { createArray } from "@shared/utils/testing";

describe("bulkVertexDetailsQuery", () => {
  it("should return nothing when input is empty", async () => {
    const dbState = new DbState();
    const queryClient = createQueryClient({ explorer: dbState.explorer });

    const result = await queryClient.ensureQueryData(
      bulkVertexDetailsQuery([])
    );

    expect(result.vertices).toEqual([]);
    expect(dbState.explorer.bulkVertexDetails).toBeCalledTimes(0);
  });

  it("should return cached when input is cached", async () => {
    const dbState = new DbState();
    const queryClient = createQueryClient({ explorer: dbState.explorer });

    const vertex = createRandomVertex();

    // Add vertices to cache
    const cachedResponse: VertexDetailsResponse = {
      vertex,
    };
    queryClient.setQueryData(
      vertexDetailsQuery(vertex.id).queryKey,
      cachedResponse
    );

    const result = await queryClient.ensureQueryData(
      bulkVertexDetailsQuery([vertex.id])
    );

    expect(result.vertices).toEqual([vertex]);
    expect(dbState.explorer.bulkVertexDetails).toBeCalledTimes(0);

    // Ensure vertex is still in the cache
    expect(
      queryClient.getQueryData(vertexDetailsQuery(vertex.id).queryKey)
    ).toEqual({ vertex });
  });

  it("should fetch details for input", async () => {
    const dbState = new DbState();
    const queryClient = createQueryClient({ explorer: dbState.explorer });

    const vertex = createRandomVertex();

    // Mock fetch response
    vi.mocked(dbState.explorer.bulkVertexDetails).mockResolvedValueOnce({
      vertices: [vertex],
    });

    const result = await queryClient.ensureQueryData(
      bulkVertexDetailsQuery([vertex.id])
    );

    expect(result.vertices).toEqual([vertex]);
    expect(dbState.explorer.bulkVertexDetails).toBeCalledTimes(1);

    // Ensure vertex is added to the cache
    expect(
      queryClient.getQueryData(vertexDetailsQuery(vertex.id).queryKey)
    ).toEqual({ vertex });
  });

  it("should batch fetches for input", async () => {
    const dbState = new DbState();
    const queryClient = createQueryClient({ explorer: dbState.explorer });

    const vertices = createArray(300, createRandomVertex);

    // Mock fetch response
    vi.mocked(dbState.explorer.bulkVertexDetails).mockImplementation(
      ({ vertexIds }) =>
        Promise.resolve({
          vertices: vertices.filter(v => vertexIds.includes(v.id)),
        })
    );

    const result = await queryClient.ensureQueryData(
      bulkVertexDetailsQuery(vertices.map(v => v.id))
    );

    expect(result.vertices).toEqual(vertices);
    expect(dbState.explorer.bulkVertexDetails).toBeCalledTimes(3);

    // Ensure all are added to the cache
    for (const vertex of vertices) {
      expect(
        queryClient.getQueryData(vertexDetailsQuery(vertex.id).queryKey)
      ).toEqual({ vertex });
    }
  });
});
