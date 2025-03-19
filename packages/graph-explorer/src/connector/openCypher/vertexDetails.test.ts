import { createRandomVertex } from "@/utils/testing";
import { vertexDetails } from "./vertexDetails";
import { Vertex } from "@/core";

describe("vertexDetails", () => {
  it("should return the vertex details", async () => {
    const vertex = createRandomVertex();

    const response = createResponseFromVertex(vertex);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));

    const result = await vertexDetails(mockFetch, { vertexId: vertex.id });

    expect(result.vertex).toEqual(vertex);
  });
});

function createResponseFromVertex(vertex: Vertex) {
  return {
    results: [
      {
        vertex: {
          "~id": vertex.id,
          "~labels": [vertex.type],
          "~properties": vertex.attributes,
        },
      },
    ],
  };
}
