import { createRandomVertex } from "@/utils/testing";
import { vertexDetails } from "./vertexDetails";
import { Vertex } from "@/core";

describe("vertexDetails", () => {
  it("should return the correct vertex details", async () => {
    const vertex = createRandomVertex();

    // Align with the gremlin mapper
    vertex.types = [vertex.type];
    vertex.__isFragment = false;

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

function createGremlinResponseFromVertex(vertex: Vertex) {
  return {
    result: {
      data: {
        "@type": "g:List",
        "@value": [
          {
            "@type": "g:Vertex",
            "@value": {
              id: vertex.id,
              label: vertex.type,
              properties: createProperties(vertex.attributes),
            },
          },
        ],
      },
    },
  };
}

function createProperties(attributes: Vertex["attributes"]) {
  const mapped = Object.entries(attributes).map(([key, value]) => ({
    "@type": "g:VertexProperty",
    "@value": {
      label: key,
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
    result[prop["@value"].label] = [prop];
  });

  return result;
}
