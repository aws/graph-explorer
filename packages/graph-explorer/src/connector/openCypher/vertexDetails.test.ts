import { createTestableVertex, mapToOcVertex } from "@/utils/testing";
import { vertexDetails } from "./vertexDetails";
import { ResultVertex } from "@/core";

describe("vertexDetails", () => {
  it("should return empty for empty request", async () => {
    const mockFetch = vi.fn();
    const result = await vertexDetails(mockFetch, { vertexIds: [] });
    expect(result.vertices).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return the vertex details", async () => {
    const vertex = createTestableVertex();

    const response = createResponse(vertex.asResult());
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await vertexDetails(mockFetch, { vertexIds: [vertex.id] });

    expect(result.vertices).toEqual([vertex.asVertex()]);
  });

  it("should return the vertex details for multiple vertices", async () => {
    const vertex1 = createTestableVertex();
    const vertex2 = createTestableVertex();

    const response = createResponse(vertex1.asResult(), vertex2.asResult());
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await vertexDetails(mockFetch, {
      vertexIds: [vertex1.id, vertex2.id],
    });

    expect(result.vertices).toEqual([vertex1.asVertex(), vertex2.asVertex()]);
  });
});

function createResponse(...vertices: ResultVertex[]) {
  return {
    results: vertices.map(vertex => ({
      vertex: mapToOcVertex(vertex),
    })),
  };
}
