import { getAppStore, nodesAtom } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { createTestableVertex, FakeExplorer } from "@/utils/testing";

import { searchQuery } from "./searchQuery";
import { vertexDetailsQuery } from "./vertexDetailsQuery";

describe("searchQuery", () => {
  it("should return empty results when no matches found", async () => {
    const explorer = new FakeExplorer();
    const keywordSearchSpy = vi.spyOn(explorer, "keywordSearch");
    const queryClient = createQueryClient({ explorer });

    keywordSearchSpy.mockResolvedValue({ vertices: [], edges: [] });
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      searchQuery({ searchTerm: "test" }, mockUpdateSchema),
    );

    expect(result.vertices).toStrictEqual([]);
    expect(keywordSearchSpy).toBeCalledTimes(1);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(result);
  });

  it("should return search results", async () => {
    const explorer = new FakeExplorer();
    const keywordSearchSpy = vi.spyOn(explorer, "keywordSearch");
    const queryClient = createQueryClient({ explorer });

    const vertex1 = createTestableVertex();
    const vertex2 = createTestableVertex();

    keywordSearchSpy.mockResolvedValue({
      vertices: [vertex1.asVertex(), vertex2.asVertex()],
      edges: [],
    });
    const mockUpdateSchema = vi.fn();

    const result = await queryClient.fetchQuery(
      searchQuery({ searchTerm: "test" }, mockUpdateSchema),
    );

    expect(result.vertices).toStrictEqual([
      vertex1.asVertex(),
      vertex2.asVertex(),
    ]);
    expect(keywordSearchSpy).toBeCalledTimes(1);
    expect(mockUpdateSchema).toHaveBeenCalledExactlyOnceWith(result);
  });

  it("should cache vertex details", async () => {
    const explorer = new FakeExplorer();
    const keywordSearchSpy = vi.spyOn(explorer, "keywordSearch");
    const queryClient = createQueryClient({ explorer });

    const vertex = createTestableVertex();

    keywordSearchSpy.mockResolvedValue({
      vertices: [vertex.asVertex()],
      edges: [],
    });
    const mockUpdateSchema = vi.fn();

    await queryClient.fetchQuery(
      searchQuery({ searchTerm: "test" }, mockUpdateSchema),
    );

    // Verify vertex is added to the cache
    expect(
      queryClient.getQueryData(vertexDetailsQuery(vertex.id).queryKey),
    ).toStrictEqual({ vertex: vertex.asVertex() });
  });

  it("should update nodesAtom when vertices are already in graph", async () => {
    const explorer = new FakeExplorer();
    const keywordSearchSpy = vi.spyOn(explorer, "keywordSearch");
    const queryClient = createQueryClient({ explorer });

    const originalVertex = createTestableVertex();
    const updatedVertex = originalVertex.with({
      attributes: { name: "Updated Name" },
    });

    // Add original vertex to nodesAtom
    getAppStore().set(
      nodesAtom,
      new Map([[originalVertex.id, originalVertex.asVertex()]]),
    );

    // Mock search to return updated vertex
    keywordSearchSpy.mockResolvedValue({
      vertices: [updatedVertex.asVertex()],
      edges: [],
    });
    const mockUpdateSchema = vi.fn();

    await queryClient.fetchQuery(
      searchQuery({ searchTerm: "test" }, mockUpdateSchema),
    );

    // Verify nodesAtom was updated with the new vertex data
    const nodesMap = getAppStore().get(nodesAtom);
    expect(nodesMap.get(originalVertex.id)).toStrictEqual(
      updatedVertex.asVertex(),
    );
  });

  it("should not update nodesAtom when vertices are not in graph", async () => {
    const explorer = new FakeExplorer();
    const keywordSearchSpy = vi.spyOn(explorer, "keywordSearch");
    const queryClient = createQueryClient({ explorer });

    const vertex1 = createTestableVertex();
    const vertex2 = createTestableVertex();

    keywordSearchSpy.mockResolvedValue({
      vertices: [vertex1.asVertex(), vertex2.asVertex()],
      edges: [],
    });
    const mockUpdateSchema = vi.fn();

    // nodesAtom is empty
    expect(getAppStore().get(nodesAtom).size).toBe(0);

    await queryClient.fetchQuery(
      searchQuery({ searchTerm: "test" }, mockUpdateSchema),
    );

    // Verify nodesAtom was not modified
    expect(getAppStore().get(nodesAtom).size).toBe(0);
  });
});
