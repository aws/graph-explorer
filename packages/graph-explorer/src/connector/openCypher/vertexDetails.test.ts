import { createRandomVertex, mapToOcVertex } from "@/utils/testing";
import { vertexDetails } from "./vertexDetails";
import { Vertex } from "@/core";

describe("vertexDetails", () => {
  it("should return empty for empty request", async () => {
    const mockFetch = vi.fn();
    const result = await vertexDetails(mockFetch, { vertexIds: [] });
    expect(result.vertices).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return the vertex details", async () => {
    const vertex = createRandomVertex();

    const response = createResponse(vertex);
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await vertexDetails(mockFetch, { vertexIds: [vertex.id] });

    expect(result.vertices).toEqual([vertex]);
  });

  it("should return the vertex details for multiple vertices", async () => {
    const vertex1 = createRandomVertex();
    const vertex2 = createRandomVertex();

    const response = createResponse(vertex1, vertex2);
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await vertexDetails(mockFetch, {
      vertexIds: [vertex1.id, vertex2.id],
    });

    expect(result.vertices).toEqual([vertex1, vertex2]);
  });
});

function createResponse(...vertices: Vertex[]) {
  return {
    results: vertices.map(vertex => ({
      vertex: mapToOcVertex(vertex),
    })),
  };
}
