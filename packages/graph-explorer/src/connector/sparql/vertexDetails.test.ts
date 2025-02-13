import { createRandomVertexForRdf } from "@/utils/testing";
import { vertexDetails } from "./vertexDetails";
import { createVertexId, Vertex } from "@/core";
import { createRandomInteger } from "@shared/utils/testing";

describe("vertexDetails", () => {
  it("should return the vertex details", async () => {
    const vertex = createRandomVertexForRdf();
    const response = createResponseFromVertex(vertex);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));

    const result = await vertexDetails(mockFetch, { vertexId: vertex.id });

    expect(result.vertex).toEqual(vertex);
  });

  it("should throw an error when the vertex ID is not a string", async () => {
    const vertex = createRandomVertexForRdf();
    vertex.id = createVertexId(createRandomInteger());
    const response = createResponseFromVertex(vertex);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));

    await expect(
      vertexDetails(mockFetch, { vertexId: vertex.id })
    ).rejects.toThrow("ID must be a URI");
  });

  it("should throw an error when the vertex ID is not a string", async () => {
    const vertex = createRandomVertexForRdf();
    vertex.id = createVertexId(createRandomInteger());
    const response = createResponseFromVertex(vertex);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));

    await expect(
      vertexDetails(mockFetch, { vertexId: vertex.id })
    ).rejects.toThrow("ID must be a URI");
  });
});

function createResponseFromVertex(vertex: Vertex) {
  return {
    head: {
      vars: ["label", "value"],
    },
    results: {
      bindings: [
        {
          label: {
            type: "uri",
            value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
          },
          value: {
            type: "uri",
            value: vertex.type,
          },
        },
        ...Object.entries(vertex.attributes).map(([key, value]) => ({
          label: {
            type: "uri",
            value: key,
          },
          value: {
            type: "literal",
            value: value.toString(),
            // Only include the datatype if the value is a number
            ...(typeof value === "number" && {
              datatype: value.toString().includes(".")
                ? "http://www.w3.org/2001/XMLSchema#decimal"
                : "http://www.w3.org/2001/XMLSchema#integer",
            }),
          },
        })),
      ],
    },
  };
}
