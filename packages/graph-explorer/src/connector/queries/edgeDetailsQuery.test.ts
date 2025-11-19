import {
  createRandomEdge,
  createRandomEdgeId,
  FakeExplorer,
} from "@/utils/testing";
import { edgeDetailsQuery } from "./edgeDetailsQuery";
import { createQueryClient } from "@/core/queryClient";
import { edgesAtom, getAppStore } from "@/core";

describe("edgeDetailsQuery", () => {
  it("should return null when edge is not found", async () => {
    const explorer = new FakeExplorer();
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");
    const queryClient = createQueryClient({ explorer });

    const result = await queryClient.fetchQuery(
      edgeDetailsQuery(createRandomEdgeId()),
    );

    expect(result.edge).toBeNull();
    expect(edgeDetailsSpy).toBeCalledTimes(1);
  });

  it("should fetch details for input", async () => {
    const explorer = new FakeExplorer();
    const edgeDetailsSpy = vi.spyOn(explorer, "edgeDetails");
    const queryClient = createQueryClient({ explorer });

    const edge = createRandomEdge();
    explorer.addEdge(edge);

    const result = await queryClient.fetchQuery(edgeDetailsQuery(edge.id));

    expect(result.edge).toStrictEqual(edge);
    expect(edgeDetailsSpy).toBeCalledTimes(1);
  });

  it("should update edgesAtom when edge is already in graph", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const originalEdge = createRandomEdge();
    const updatedEdge = {
      ...originalEdge,
      attributes: { ...originalEdge.attributes, weight: 42 },
    };

    // Add original edge to edgesAtom
    getAppStore().set(edgesAtom, new Map([[originalEdge.id, originalEdge]]));

    // Mock explorer to return updated edge
    explorer.addEdge(updatedEdge);

    await queryClient.fetchQuery(edgeDetailsQuery(originalEdge.id));

    // Verify edgesAtom was updated with the new edge data
    const edgesMap = getAppStore().get(edgesAtom);
    expect(edgesMap.get(originalEdge.id)).toStrictEqual(updatedEdge);
  });

  it("should not update edgesAtom when edge is not in graph", async () => {
    const explorer = new FakeExplorer();
    const queryClient = createQueryClient({ explorer });

    const edge = createRandomEdge();
    explorer.addEdge(edge);

    // edgesAtom is empty
    expect(getAppStore().get(edgesAtom).size).toBe(0);

    await queryClient.fetchQuery(edgeDetailsQuery(edge.id));

    // Verify edgesAtom was not modified
    expect(getAppStore().get(edgesAtom).size).toBe(0);
  });
});
