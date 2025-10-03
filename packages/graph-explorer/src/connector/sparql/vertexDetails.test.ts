import { createLiteralValue, createRandomVertexForRdf } from "@/utils/testing";
import { vertexDetails } from "./vertexDetails";
import { createVertexId, Vertex } from "@/core";
import { createRandomInteger } from "@shared/utils/testing";
import { query } from "@/utils";

describe("vertexDetails", () => {
  it("should return an empty array when no vertex IDs are provided", async () => {
    const mockFetch = vi.fn();

    const result = await vertexDetails(mockFetch, { vertexIds: [] });

    expect(result.vertices).toStrictEqual([]);
  });

  it("should return one vertex detail", async () => {
    const vertex = createRandomVertexForRdf();
    const response = createResponseFromVertices(vertex);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));

    const result = await vertexDetails(mockFetch, { vertexIds: [vertex.id] });

    expect(result.vertices).toStrictEqual([vertex]);
  });

  it("should use template with one vertex ID", async () => {
    const vertex = createRandomVertexForRdf();
    const response = createResponseFromVertices(vertex);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));

    await vertexDetails(mockFetch, { vertexIds: [vertex.id] });

    expect(mockFetch).toHaveBeenCalledWith(
      query`
        # Get the resource attributes and class
        SELECT ?resource ?label ?value
        WHERE {
          VALUES ?resource { 
            <${vertex.id}> 
          }
          ?resource ?label ?value .
          FILTER(isLiteral(?value) || ?label = rdf:type)
        }
      `
    );
  });

  it("should use template with multiple vertex IDs", async () => {
    const vertices = [createRandomVertexForRdf(), createRandomVertexForRdf()];
    const response = createResponseFromVertices(...vertices);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));

    await vertexDetails(mockFetch, {
      vertexIds: vertices.map(vertex => vertex.id),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      query`
        # Get the resource attributes and class
        SELECT ?resource ?label ?value
        WHERE {
          VALUES ?resource {
            <${vertices[0].id}>
            <${vertices[1].id}>
          }
          ?resource ?label ?value .
          FILTER(isLiteral(?value) || ?label = rdf:type)
        }
      `
    );
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

    expect(result.vertices).toStrictEqual(vertices);
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
            value: createLiteralValue(value),
          })),
        ];
      }),
    },
  };
}
