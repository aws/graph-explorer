import { createRandomVertex, FakeExplorer } from "@/utils/testing";
import { bulkVertexDetailsQuery } from "./bulkVertexDetailsQuery";
import { vertexDetailsQuery } from "./vertexDetailsQuery";
import { createQueryClient } from "@/core/queryClient";
import { createArray } from "@shared/utils/testing";
import { DEFAULT_BATCH_REQUEST_SIZE } from "@/utils";

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
