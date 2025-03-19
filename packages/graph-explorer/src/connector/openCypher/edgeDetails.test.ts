import { createRandomEdge, createRandomVertex } from "@/utils/testing";
import { edgeDetails } from "./edgeDetails";
import { Edge } from "@/core";

describe("edgeDetails", () => {
  it("should return the edge details", async () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());

    const response = createResponseFromEdge(edge);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));

    const result = await edgeDetails(mockFetch, { edgeId: edge.id });

    expect(result.edge).toEqual(edge);
  });
});

function createResponseFromEdge(edge: Edge) {
  return {
    results: [
      {
        edge: {
          "~id": edge.id,
          "~type": edge.type,
          "~start": edge.source,
          "~end": edge.target,
          "~properties": edge.attributes,
        },
        sourceLabels: edge.sourceTypes,
        targetLabels: edge.targetTypes,
      },
    ],
  };
}
