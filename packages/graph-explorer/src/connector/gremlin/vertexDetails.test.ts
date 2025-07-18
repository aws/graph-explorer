import {
  createGremlinResponseFromVertices,
  createRandomVertex,
} from "@/utils/testing";
import { vertexDetails } from "./vertexDetails";

describe("vertexDetails", () => {
  it("should return empty when request is empty", async () => {
    const mockFetch = vi.fn();

    const result = await vertexDetails(mockFetch, {
      vertexIds: [],
    });

    expect(result.vertices).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return the correct vertex details", async () => {
    const vertex = createRandomVertex();
    const response = createGremlinResponseFromVertices(vertex);
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await vertexDetails(mockFetch, {
      vertexIds: [vertex.id],
    });

    expect(result.vertices).toEqual([vertex]);
  });

  it("should return multiple details when request includes multiple IDs", async () => {
    const vertex1 = createRandomVertex();
    const vertex2 = createRandomVertex();
    const response = createGremlinResponseFromVertices(vertex1, vertex2);
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await vertexDetails(mockFetch, {
      vertexIds: [vertex1.id, vertex2.id],
    });

    expect(result.vertices).toEqual([vertex1, vertex2]);
  });

  it("should not be fragment if the response does not include the properties", async () => {
    const vertex = createRandomVertex();
    vertex.attributes = {};
    vertex.__isFragment = true;
    const response = createGremlinResponseFromVertices(vertex);
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await vertexDetails(mockFetch, {
      vertexIds: [vertex.id],
    });

    expect(result.vertices[0]?.__isFragment).toBe(false);
  });
});
