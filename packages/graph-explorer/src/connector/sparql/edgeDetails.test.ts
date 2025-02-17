import { Edge, EdgeId } from "@/core";
import {
  createRandomEdgeForRdf,
  createRandomVertexForRdf,
} from "@/utils/testing";
import { edgeDetails } from "./edgeDetails";
import { createRandomUrlString } from "@shared/utils/testing";

describe("edgeDetails", () => {
  it("should return the edge details", async () => {
    const edge = createRandomEdgeForRdf(
      createRandomVertexForRdf(),
      createRandomVertexForRdf()
    );
    const response = createResponseFromEdge(edge);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));
    const result = await edgeDetails(mockFetch, { edgeId: edge.id });
    expect(result.edge).toEqual(edge);
  });

  it("should throw an error when the edge ID is not in the RDF edge ID format", async () => {
    const edge = createRandomEdgeForRdf(
      createRandomVertexForRdf(),
      createRandomVertexForRdf()
    );
    // Missing the brackets
    edge.id = `${edge.source}-${edge.type}->${edge.target}` as EdgeId;
    const response = createResponseFromEdge(edge);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));

    await expect(edgeDetails(mockFetch, { edgeId: edge.id })).rejects.toThrow(
      "Invalid RDF edge ID"
    );
  });

  it("should throw an error when the source vertex ID doesn't match the response", async () => {
    const edge = createRandomEdgeForRdf(
      createRandomVertexForRdf(),
      createRandomVertexForRdf()
    );
    edge.id =
      `${createRandomUrlString()}-[${edge.type}]->${edge.target}` as EdgeId;
    const response = createResponseFromEdge(edge);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));

    await expect(edgeDetails(mockFetch, { edgeId: edge.id })).rejects.toThrow(
      "Edge type not found in bindings"
    );
  });

  it("should throw an error when the target vertex ID doesn't match the response", async () => {
    const edge = createRandomEdgeForRdf(
      createRandomVertexForRdf(),
      createRandomVertexForRdf()
    );
    edge.id =
      `${edge.source}-[${edge.type}]->${createRandomUrlString()}` as EdgeId;
    const response = createResponseFromEdge(edge);
    const mockFetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(response));

    await expect(edgeDetails(mockFetch, { edgeId: edge.id })).rejects.toThrow(
      "Edge type not found in bindings"
    );
  });
});

function createResponseFromEdge(edge: Edge) {
  const source = edge.source;
  const target = edge.target;

  return {
    head: {
      vars: ["resource", "type"],
    },
    results: {
      bindings: [
        {
          resource: {
            type: "uri",
            value: source,
          },
          type: {
            type: "uri",
            value: edge.sourceType,
          },
        },
        {
          resource: {
            type: "uri",
            value: target,
          },
          type: {
            type: "uri",
            value: edge.targetType,
          },
        },
      ],
    },
  };
}
