import {
  createGremlinResponseFromVertex,
  createRandomVertex,
} from "@/utils/testing";
import { vertexDetails } from "./vertexDetails";

describe("vertexDetails", () => {
  it("should return the correct vertex details", async () => {
    const vertex = createRandomVertex();
    const response = createGremlinResponseFromVertex(vertex);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));

    const result = await vertexDetails(mockFetch, {
      vertexId: vertex.id,
    });

    expect(result.vertex).toEqual(vertex);
  });
});
