import { createArray } from "@shared/utils/testing";

import { edgesAtom, getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { DEFAULT_BATCH_REQUEST_SIZE } from "@/utils";
import { createRandomEdge, FakeExplorer } from "@/utils/testing";

import { bulkEdgeDetailsQuery } from "./bulkEdgeDetailsQuery";
import { edgeDetailsQuery } from "./edgeDetailsQuery";

describe("bulkEdgeDetailsQuery", () => {
  it("should return nothing when input is empty", async () => {
    const explorer = new FakeExplorer();
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");
    const queryClient = createQueryClient({ explorer });

    const result = await queryClient.fetchQuery(bulkEdgeDetailsQuery([]));

    expect(result.edges).toStrictEqual([]);
    expect(edgeDetailsSpy).toBeCalledTimes(0);
  });

  it("should return cached when input is cached", async () => {
    const explorer = new FakeExplorer();
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");
    const queryClient = createQueryClient({ explorer });

    const edge = createRandomEdge();

    // Add edges to cache
    queryClient.setQueryData(edgeDetailsQuery(edge.id).queryKey, { edge });

    const result = await queryClient.fetchQuery(
      bulkEdgeDetailsQuery([edge.id]),
    );

    expect(result.edges).toStrictEqual([edge]);
    expect(edgeDetailsSpy).toBeCalledTimes(0);

    // Ensure edge is still in the cache
    expect(
      queryClient.getQueryData(edgeDetailsQuery(edge.id).queryKey),
    ).toStrictEqual({ edge });
  });

  it("should fetch details for input", async () => {
    const explorer = new FakeExplorer();
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");
    const queryClient = createQueryClient({ explorer });

    const edge = createRandomEdge();
    explorer.addEdge(edge);

    const result = await queryClient.fetchQuery(
      bulkEdgeDetailsQuery([edge.id]),
    );

    expect(result.edges).toStrictEqual([edge]);
    expect(edgeDetailsSpy).toBeCalledTimes(1);

    // Ensure edge is added to the cache
    expect(
      queryClient.getQueryData(edgeDetailsQuery(edge.id).queryKey),
    ).toStrictEqual({ edge });
  });

  it("should combine cached and fetched results", async () => {
    const explorer = new FakeExplorer();
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");
    const queryClient = createQueryClient({ explorer });

    const edgeCached = createRandomEdge();

    // Add edges to cache
    queryClient.setQueryData(edgeDetailsQuery(edgeCached.id).queryKey, {
      edge: edgeCached,
    });

    // Add edge to explorer
    const edgeFetched = createRandomEdge();
    explorer.addEdge(edgeFetched);

    const result = await queryClient.fetchQuery(
      bulkEdgeDetailsQuery([edgeCached.id, edgeFetched.id]),
    );

    expect(result.edges).toStrictEqual([edgeCached, edgeFetched]);
    expect(edgeDetailsSpy).toBeCalledTimes(1);

    // Ensure both edges are added to the cache
    expect(
      queryClient.getQueryData(edgeDetailsQuery(edgeCached.id).queryKey),
    ).toStrictEqual({ edge: edgeCached });
    expect(
      queryClient.getQueryData(edgeDetailsQuery(edgeFetched.id).queryKey),
    ).toStrictEqual({ edge: edgeFetched });
  });

  it("should batch fetches for input", async () => {
    const explorer = new FakeExplorer();
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");
    const queryClient = createQueryClient({ explorer });

    const edges = createArray(DEFAULT_BATCH_REQUEST_SIZE * 3, () =>
      createRandomEdge(),
    );
    edges.forEach(e => explorer.addEdge(e));

    const result = await queryClient.fetchQuery(
      bulkEdgeDetailsQuery(edges.map(e => e.id)),
    );

    expect(result.edges).toStrictEqual(edges);
    expect(edgeDetailsSpy).toBeCalledTimes(3);

    // Ensure all are added to the cache
    for (const edge of edges) {
      expect(
        queryClient.getQueryData(edgeDetailsQuery(edge.id).queryKey),
      ).toStrictEqual({ edge });
    }
  });

  it("should update edgesAtom when edges are already in graph", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const originalEdge1 = createRandomEdge();
    const originalEdge2 = createRandomEdge();
    const updatedEdge1 = {
      ...originalEdge1,
      attributes: { ...originalEdge1.attributes, weight: 10 },
    };
    const updatedEdge2 = {
      ...originalEdge2,
      attributes: { ...originalEdge2.attributes, weight: 20 },
    };

    // Add original edges to edgesAtom
    getAppStore().set(
      edgesAtom,
      new Map([
        [originalEdge1.id, originalEdge1],
        [originalEdge2.id, originalEdge2],
      ]),
    );

    // Mock explorer to return updated edges
    explorer.addEdge(updatedEdge1);
    explorer.addEdge(updatedEdge2);

    await queryClient.fetchQuery(
      bulkEdgeDetailsQuery([originalEdge1.id, originalEdge2.id]),
    );

    // Verify edgesAtom was updated with the new edge data
    const edgesMap = getAppStore().get(edgesAtom);
    expect(edgesMap.get(originalEdge1.id)).toStrictEqual(updatedEdge1);
    expect(edgesMap.get(originalEdge2.id)).toStrictEqual(updatedEdge2);
  });

  it("should not update edgesAtom when edges are not in graph", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const edge1 = createRandomEdge();
    const edge2 = createRandomEdge();
    explorer.addEdge(edge1);
    explorer.addEdge(edge2);

    // edgesAtom is empty
    expect(getAppStore().get(edgesAtom).size).toBe(0);

    await queryClient.fetchQuery(bulkEdgeDetailsQuery([edge1.id, edge2.id]));

    // Verify edgesAtom was not modified
    expect(getAppStore().get(edgesAtom).size).toBe(0);
  });

  it("should ignore cache when ignoreCache option is true", async () => {
    const explorer = new FakeExplorer();
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");
    const queryClient = createQueryClient({ explorer });

    const cachedEdge = createRandomEdge();
    const updatedEdge = {
      ...cachedEdge,
      attributes: { ...cachedEdge.attributes, weight: 100 },
    };

    // Add edge to cache
    queryClient.setQueryData(edgeDetailsQuery(cachedEdge.id).queryKey, {
      edge: cachedEdge,
    });

    // Add updated edge to explorer
    explorer.addEdge(updatedEdge);

    const result = await queryClient.fetchQuery(
      bulkEdgeDetailsQuery([cachedEdge.id], { ignoreCache: true }),
    );

    expect(result.edges).toStrictEqual([updatedEdge]);
    expect(edgeDetailsSpy).toBeCalledTimes(1);

    // Ensure cache is updated with new data
    expect(
      queryClient.getQueryData(edgeDetailsQuery(cachedEdge.id).queryKey),
    ).toStrictEqual({ edge: updatedEdge });
  });

  it("should use cache when ignoreCache option is false", async () => {
    const explorer = new FakeExplorer();
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");
    const queryClient = createQueryClient({ explorer });

    const cachedEdge = createRandomEdge();

    // Add edge to cache
    queryClient.setQueryData(edgeDetailsQuery(cachedEdge.id).queryKey, {
      edge: cachedEdge,
    });

    const result = await queryClient.fetchQuery(
      bulkEdgeDetailsQuery([cachedEdge.id], { ignoreCache: false }),
    );

    expect(result.edges).toStrictEqual([cachedEdge]);
    expect(edgeDetailsSpy).toBeCalledTimes(0);
  });
});
