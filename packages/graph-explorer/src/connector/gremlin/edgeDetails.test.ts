import { createGEdge, createRandomEdge } from "@/utils/testing";
import { edgeDetails } from "./edgeDetails";
import { Edge } from "@/core";

describe("edgeDetails", () => {
  it("should return empty when request is empty", async () => {
    const mockFetch = vi.fn();

    const result = await edgeDetails(mockFetch, {
      edgeIds: [],
    });

    expect(result.edges).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return the correct edge details", async () => {
    const edge = createRandomEdge();
    const response = createResponseFromEdges(edge);
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await edgeDetails(mockFetch, {
      edgeIds: [edge.id],
    });

    expect(result.edges).toEqual([edge]);
  });

  it("should return multiple details when request includes multiple IDs", async () => {
    const edge1 = createRandomEdge();
    const edge2 = createRandomEdge();
    const response = createResponseFromEdges(edge1, edge2);
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await edgeDetails(mockFetch, {
      edgeIds: [edge1.id, edge2.id],
    });

    expect(result.edges).toEqual([edge1, edge2]);
  });

  it("should not be fragment if the response does not include the properties", async () => {
    const edge = createRandomEdge();
    edge.attributes = {};
    edge.__isFragment = true;
    const response = createResponseFromEdges(edge);
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await edgeDetails(mockFetch, {
      edgeIds: [edge.id],
    });

    expect(result.edges[0]?.__isFragment).toBe(false);
  });
});

function createResponseFromEdges(...edges: Edge[]) {
  return {
    result: {
      data: {
        "@type": "g:List",
        "@value": edges.map(createGEdge),
      },
    },
  };
}
