import { createTestableEdge, mapToOcEdge } from "@/utils/testing";
import { edgeDetails } from "./edgeDetails";
import { Edge, ResultEdge } from "@/core";

describe("edgeDetails", () => {
  it("should return empty when request is empty", async () => {
    const mockFetch = vi.fn();

    const result = await edgeDetails(mockFetch, {
      edgeIds: [],
    });

    expect(result.edges).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return the edge details", async () => {
    const edge = createTestableEdge();

    const response = createResponseFromEdges(edge.asResult());
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await edgeDetails(mockFetch, { edgeIds: [edge.id] });

    expect(result.edges).toEqual([edge.asEdge()]);
  });

  it("should return multiple details when request includes multiple IDs", async () => {
    const edge1 = createTestableEdge();
    const edge2 = createTestableEdge();
    const response = createResponseFromEdges(
      edge1.asResult(),
      edge2.asResult()
    );
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await edgeDetails(mockFetch, {
      edgeIds: [edge1.id, edge2.id],
    });

    expect(result.edges).toEqual([edge1.asEdge(), edge2.asEdge()]);
  });
});

function createResponseFromEdges(...edges: (Edge | ResultEdge)[]) {
  return {
    results: edges.map(edge => ({
      edge: mapToOcEdge(edge),
    })),
  };
}
