import { createRandomVertexForRdf } from "@/utils/testing";
import { vertexDetails } from "./vertexDetails";
import { createVertexId, Vertex } from "@/core";
import { createRandomInteger } from "@shared/utils/testing";

describe("vertexDetails", () => {
  it("should return an empty array when no vertex IDs are provided", async () => {
    const mockFetch = vi.fn();

    const result = await vertexDetails(mockFetch, { vertexIds: [] });

    expect(result.vertices).toEqual([]);
  });

  it("should return one vertex detail", async () => {
    const vertex = createRandomVertexForRdf();
    const response = createResponseFromVertices(vertex);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));

    const result = await vertexDetails(mockFetch, { vertexIds: [vertex.id] });

    expect(result.vertices).toEqual([vertex]);
  });

  it("should return multiple vertex details", async () => {
    const vertices = [createRandomVertexForRdf(), createRandomVertexForRdf()];
    const responses = createResponseFromVertices(...vertices);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(responses));

    const result = await vertexDetails(mockFetch, {
      vertexIds: vertices.map(vertex => vertex.id),
    });

    expect(result.vertices).toEqual(vertices);
  });

  it("should throw an error when the vertex ID is not a string", async () => {
    const vertex = createRandomVertexForRdf();
    vertex.id = createVertexId(createRandomInteger());
    const response = createResponseFromVertices(vertex);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));

    await expect(
      vertexDetails(mockFetch, { vertexIds: [vertex.id] })
    ).rejects.toThrow("ID must be a URI");
  });
});

function createResponseFromVertices(...vertices: Vertex[]) {
  return {
    head: {
      vars: ["resource", "label", "value"],
    },
    results: {
      bindings: vertices.flatMap(vertex => {
        return [
          {
            resource: {
              type: "uri",
              value: String(vertex.id),
            },
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
            resource: {
              type: "uri",
              value: String(vertex.id),
            },
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
        ];
      }),
    },
  };
}
