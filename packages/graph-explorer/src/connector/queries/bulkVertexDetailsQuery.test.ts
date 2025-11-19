import { createRandomVertex, FakeExplorer } from "@/utils/testing";
import { bulkVertexDetailsQuery } from "./bulkVertexDetailsQuery";
import { vertexDetailsQuery } from "./vertexDetailsQuery";
import { createQueryClient } from "@/core/queryClient";
import { createArray } from "@shared/utils/testing";
import { DEFAULT_BATCH_REQUEST_SIZE } from "@/utils";
import { getAppStore, nodesAtom } from "@/core";

describe("bulkVertexDetailsQuery", () => {
  it("should return nothing when input is empty", async () => {
    const explorer = new FakeExplorer();
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const queryClient = createQueryClient({ explorer });

    const result = await queryClient.fetchQuery(bulkVertexDetailsQuery([]));

    expect(result.vertices).toStrictEqual([]);
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
      bulkVertexDetailsQuery([vertex.id]),
    );

    expect(result.vertices).toStrictEqual([vertex]);
    expect(vertexDetailsSpy).toBeCalledTimes(0);

    // Ensure vertex is still in the cache
    expect(
      queryClient.getQueryData(vertexDetailsQuery(vertex.id).queryKey),
    ).toStrictEqual({ vertex });
  });

  it("should fetch details for input", async () => {
    const explorer = new FakeExplorer();
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const queryClient = createQueryClient({ explorer });

    const vertex = createRandomVertex();
    explorer.addVertex(vertex);

    const result = await queryClient.fetchQuery(
      bulkVertexDetailsQuery([vertex.id]),
    );

    expect(result.vertices).toStrictEqual([vertex]);
    expect(vertexDetailsSpy).toBeCalledTimes(1);

    // Ensure vertex is added to the cache
    expect(
      queryClient.getQueryData(vertexDetailsQuery(vertex.id).queryKey),
    ).toStrictEqual({ vertex });
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
      bulkVertexDetailsQuery([vertexCached.id, vertexFetched.id]),
    );

    expect(result.vertices).toStrictEqual([vertexCached, vertexFetched]);
    expect(vertexDetailsSpy).toBeCalledTimes(1);

    // Ensure both vertices are added to the cache
    expect(
      queryClient.getQueryData(vertexDetailsQuery(vertexCached.id).queryKey),
    ).toStrictEqual({ vertex: vertexCached });
    expect(
      queryClient.getQueryData(vertexDetailsQuery(vertexFetched.id).queryKey),
    ).toStrictEqual({ vertex: vertexFetched });
  });

  it("should batch fetches for input", async () => {
    const explorer = new FakeExplorer();
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const queryClient = createQueryClient({ explorer });

    const vertices = createArray(
      // 3 full batches plus 1 additional, to make 4
      DEFAULT_BATCH_REQUEST_SIZE * 3 + 1,
      createRandomVertex,
    );
    vertices.forEach(v => explorer.addVertex(v));

    const result = await queryClient.fetchQuery(
      bulkVertexDetailsQuery(vertices.map(v => v.id)),
    );

    expect(result.vertices).toStrictEqual(vertices);
    expect(vertexDetailsSpy).toBeCalledTimes(4);

    // Ensure all are added to the cache
    for (const vertex of vertices) {
      expect(
        queryClient.getQueryData(vertexDetailsQuery(vertex.id).queryKey),
      ).toStrictEqual({ vertex });
    }
  });

  it("should update nodesAtom when vertices are already in graph", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const originalVertex1 = createRandomVertex();
    const originalVertex2 = createRandomVertex();
    const updatedVertex1 = {
      ...originalVertex1,
      attributes: { ...originalVertex1.attributes, name: "Updated 1" },
    };
    const updatedVertex2 = {
      ...originalVertex2,
      attributes: { ...originalVertex2.attributes, name: "Updated 2" },
    };

    // Add original vertices to nodesAtom
    getAppStore().set(
      nodesAtom,
      new Map([
        [originalVertex1.id, originalVertex1],
        [originalVertex2.id, originalVertex2],
      ]),
    );

    // Mock explorer to return updated vertices
    explorer.addVertex(updatedVertex1);
    explorer.addVertex(updatedVertex2);

    await queryClient.fetchQuery(
      bulkVertexDetailsQuery([originalVertex1.id, originalVertex2.id]),
    );

    // Verify nodesAtom was updated with the new vertex data
    const nodesMap = getAppStore().get(nodesAtom);
    expect(nodesMap.get(originalVertex1.id)).toStrictEqual(updatedVertex1);
    expect(nodesMap.get(originalVertex2.id)).toStrictEqual(updatedVertex2);
  });

  it("should not update nodesAtom when vertices are not in graph", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const vertex1 = createRandomVertex();
    const vertex2 = createRandomVertex();
    explorer.addVertex(vertex1);
    explorer.addVertex(vertex2);

    // nodesAtom is empty
    expect(getAppStore().get(nodesAtom).size).toBe(0);

    await queryClient.fetchQuery(
      bulkVertexDetailsQuery([vertex1.id, vertex2.id]),
    );

    // Verify nodesAtom was not modified
    expect(getAppStore().get(nodesAtom).size).toBe(0);
  });

  it("should ignore cache when ignoreCache option is true", async () => {
    const explorer = new FakeExplorer();
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const queryClient = createQueryClient({ explorer });

    const cachedVertex = createRandomVertex();
    const updatedVertex = {
      ...cachedVertex,
      attributes: { ...cachedVertex.attributes, name: "Updated" },
    };

    // Add vertex to cache
    queryClient.setQueryData(vertexDetailsQuery(cachedVertex.id).queryKey, {
      vertex: cachedVertex,
    });

    // Add updated vertex to explorer
    explorer.addVertex(updatedVertex);

    const result = await queryClient.fetchQuery(
      bulkVertexDetailsQuery([cachedVertex.id], { ignoreCache: true }),
    );

    expect(result.vertices).toStrictEqual([updatedVertex]);
    expect(vertexDetailsSpy).toBeCalledTimes(1);

    // Ensure cache is updated with new data
    expect(
      queryClient.getQueryData(vertexDetailsQuery(cachedVertex.id).queryKey),
    ).toStrictEqual({ vertex: updatedVertex });
  });

  it("should use cache when ignoreCache option is false", async () => {
    const explorer = new FakeExplorer();
    const vertexDetailsSpy = vi.spyOn(explorer, "vertexDetails");
    const queryClient = createQueryClient({ explorer });

    const cachedVertex = createRandomVertex();

    // Add vertex to cache
    queryClient.setQueryData(vertexDetailsQuery(cachedVertex.id).queryKey, {
      vertex: cachedVertex,
    });

    const result = await queryClient.fetchQuery(
      bulkVertexDetailsQuery([cachedVertex.id], { ignoreCache: false }),
    );

    expect(result.vertices).toStrictEqual([cachedVertex]);
    expect(vertexDetailsSpy).toBeCalledTimes(0);
  });
});
