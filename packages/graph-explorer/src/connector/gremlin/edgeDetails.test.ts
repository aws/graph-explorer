import { createRandomEdge, createRandomVertex } from "@/utils/testing";
import { edgeDetails } from "./edgeDetails";
import { Edge } from "@/core";

describe("edgeDetails", () => {
  it("should return the correct edge details", async () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
    edge.__isFragment = false;
    const response = createGremlinResponseFromEdge(edge);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));

    const result = await edgeDetails(mockFetch, {
      edgeId: edge.id,
    });

    expect(result.edge).toEqual(edge);
  });
});

function createGremlinResponseFromEdge(edge: Edge) {
  return {
    result: {
      data: {
        "@type": "g:List",
        "@value": [
          {
            "@type": "g:Edge",
            "@value": {
              id: edge.id,
              label: edge.type,
              inV: edge.target,
              outV: edge.source,
              inVLabel: edge.targetTypes.join("::"),
              outVLabel: edge.sourceTypes.join("::"),
              properties: createProperties(edge.attributes),
            },
          },
        ],
      },
    },
  };
}

function createProperties(attributes: Edge["attributes"]) {
  const mapped = Object.entries(attributes).map(([key, value]) => ({
    "@type": "g:EdgeProperty",
    "@value": {
      key,
      value:
        typeof value === "string"
          ? value
          : {
              "@type": "g:Int64",
              "@value": value,
            },
    },
  }));

  const result = {} as Record<string, any>;
  mapped.forEach(prop => {
    result[prop["@value"].key] = prop;
  });

  return result;
}
