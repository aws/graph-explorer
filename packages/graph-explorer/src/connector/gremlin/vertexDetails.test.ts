import {
  createGremlinResponseFromVertices,
  createTestableVertex,
} from "@/utils/testing";
import { vertexDetails } from "./vertexDetails";

describe("vertexDetails", () => {
  it("should return empty when request is empty", async () => {
    const mockFetch = vi.fn();

    const result = await vertexDetails(mockFetch, {
      vertexIds: [],
    });

    expect(result.vertices).toStrictEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return the correct vertex details", async () => {
    const vertex = createTestableVertex();
    const response = createGremlinResponseFromVertices(vertex.asResult());
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await vertexDetails(mockFetch, {
      vertexIds: [vertex.id],
    });

    expect(result.vertices).toStrictEqual([vertex.asVertex()]);
  });

  it("should return multiple details when request includes multiple IDs", async () => {
    const vertex1 = createTestableVertex();
    const vertex2 = createTestableVertex();
    const response = createGremlinResponseFromVertices(
      vertex1.asResult(),
      vertex2.asResult(),
    );
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await vertexDetails(mockFetch, {
      vertexIds: [vertex1.id, vertex2.id],
    });

    expect(result.vertices).toStrictEqual([
      vertex1.asVertex(),
      vertex2.asVertex(),
    ]);
  });
});
