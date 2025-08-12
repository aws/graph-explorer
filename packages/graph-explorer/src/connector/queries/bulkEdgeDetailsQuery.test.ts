import { createRandomEdge, FakeExplorer } from "@/utils/testing";
import { bulkEdgeDetailsQuery } from "./bulkEdgeDetailsQuery";
import { edgeDetailsQuery } from "./edgeDetailsQuery";
import { createQueryClient } from "@/core/queryClient";
import { createArray } from "@shared/utils/testing";
import { DEFAULT_BATCH_REQUEST_SIZE } from "@/utils";

describe("bulkEdgeDetailsQuery", () => {
  it("should return nothing when input is empty", async () => {
    const explorer = new FakeExplorer();
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");
    const queryClient = createQueryClient({ explorer });

    const result = await queryClient.fetchQuery(bulkEdgeDetailsQuery([]));

    expect(result.edges).toEqual([]);
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
      bulkEdgeDetailsQuery([edge.id])
    );

    expect(result.edges).toEqual([edge]);
    expect(edgeDetailsSpy).toBeCalledTimes(0);

    // Ensure edge is still in the cache
    expect(
      queryClient.getQueryData(edgeDetailsQuery(edge.id).queryKey)
    ).toEqual({ edge });
  });

  it("should fetch details for input", async () => {
    const explorer = new FakeExplorer();
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");
    const queryClient = createQueryClient({ explorer });

    const edge = createRandomEdge();
    explorer.addEdge(edge);

    const result = await queryClient.fetchQuery(
      bulkEdgeDetailsQuery([edge.id])
    );

    expect(result.edges).toEqual([edge]);
    expect(edgeDetailsSpy).toBeCalledTimes(1);

    // Ensure edge is added to the cache
    expect(
      queryClient.getQueryData(edgeDetailsQuery(edge.id).queryKey)
    ).toEqual({ edge });
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
      bulkEdgeDetailsQuery([edgeCached.id, edgeFetched.id])
    );

    expect(result.edges).toEqual([edgeCached, edgeFetched]);
    expect(edgeDetailsSpy).toBeCalledTimes(1);

    // Ensure both edges are added to the cache
    expect(
      queryClient.getQueryData(edgeDetailsQuery(edgeCached.id).queryKey)
    ).toEqual({ edge: edgeCached });
    expect(
      queryClient.getQueryData(edgeDetailsQuery(edgeFetched.id).queryKey)
    ).toEqual({ edge: edgeFetched });
  });

  it("should batch fetches for input", async () => {
    const explorer = new FakeExplorer();
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");
    const queryClient = createQueryClient({ explorer });

    const edges = createArray(DEFAULT_BATCH_REQUEST_SIZE * 3, () =>
      createRandomEdge()
    );
    edges.forEach(e => explorer.addEdge(e));

    const result = await queryClient.fetchQuery(
      bulkEdgeDetailsQuery(edges.map(e => e.id))
    );

    expect(result.edges).toEqual(edges);
    expect(edgeDetailsSpy).toBeCalledTimes(3);

    // Ensure all are added to the cache
    for (const edge of edges) {
      expect(
        queryClient.getQueryData(edgeDetailsQuery(edge.id).queryKey)
      ).toEqual({ edge });
    }
  });
});
