import { Edge, EdgeId } from "@/core";
import {
  createRandomEdgeForRdf,
  createRandomVertexForRdf,
} from "@/utils/testing";
import { edgeDetails } from "./edgeDetails";
import { createRandomUrlString } from "@shared/utils/testing";

describe("edgeDetails", () => {
  it("should return empty when request is empty", async () => {
    const mockFetch = vi.fn();

    const result = await edgeDetails(mockFetch, {
      edgeIds: [],
    });

    expect(result.edges).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return the edge details", async () => {
    const edge = createRandomEdgeForRdf(
      createRandomVertexForRdf(),
      createRandomVertexForRdf()
    );
    const response = createResponseFromEdges(edge);
    const mockFetch = vi.fn().mockResolvedValue(response);
    const result = await edgeDetails(mockFetch, { edgeIds: [edge.id] });
    expect(result.edges).toEqual([edge]);
  });

  it("should return multiple details when request includes multiple IDs", async () => {
    const edge1 = createRandomEdgeForRdf(
      createRandomVertexForRdf(),
      createRandomVertexForRdf()
    );
    const edge2 = createRandomEdgeForRdf(
      createRandomVertexForRdf(),
      createRandomVertexForRdf()
    );
    const response = createResponseFromEdges(edge1, edge2);
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await edgeDetails(mockFetch, {
      edgeIds: [edge1.id, edge2.id],
    });

    expect(result.edges).toEqual([edge1, edge2]);
  });

  it("should not be fragment if the response does not include the properties", async () => {
    const edge = createRandomEdgeForRdf(
      createRandomVertexForRdf(),
      createRandomVertexForRdf()
    );
    edge.attributes = {};
    edge.__isFragment = true;
    const response = createResponseFromEdges(edge);
    const mockFetch = vi.fn().mockResolvedValue(response);

    const result = await edgeDetails(mockFetch, {
      edgeIds: [edge.id],
    });

    expect(result.edges[0]?.__isFragment).toBe(false);
  });

  it("should throw an error when the edge ID is not in the RDF edge ID format", async () => {
    const edge = createRandomEdgeForRdf(
      createRandomVertexForRdf(),
      createRandomVertexForRdf()
    );
    // Missing the brackets
    edge.id = `${edge.source}-${edge.type}->${edge.target}` as EdgeId;
    const response = createResponseFromEdges(edge);
    const mockFetch = vi.fn().mockResolvedValue(response);

    await expect(
      edgeDetails(mockFetch, { edgeIds: [edge.id] })
    ).rejects.toThrow("Invalid RDF edge ID");
  });

  it("should throw an error when the source vertex ID doesn't match the response", async () => {
    const edge = createRandomEdgeForRdf(
      createRandomVertexForRdf(),
      createRandomVertexForRdf()
    );
    edge.id =
      `${createRandomUrlString()}-[${edge.type}]->${edge.target}` as EdgeId;
    const response = createResponseFromEdges(edge);
    const mockFetch = vi.fn().mockResolvedValue(response);

    await expect(
      edgeDetails(mockFetch, { edgeIds: [edge.id] })
    ).rejects.toThrow("Edge type not found in bindings");
  });

  it("should throw an error when the target vertex ID doesn't match the response", async () => {
    const edge = createRandomEdgeForRdf(
      createRandomVertexForRdf(),
      createRandomVertexForRdf()
    );
    edge.id =
      `${edge.source}-[${edge.type}]->${createRandomUrlString()}` as EdgeId;
    const response = createResponseFromEdges(edge);
    const mockFetch = vi.fn().mockResolvedValue(response);

    await expect(
      edgeDetails(mockFetch, { edgeIds: [edge.id] })
    ).rejects.toThrow("Edge type not found in bindings");
  });
});

function createResponseFromEdges(...edges: Edge[]) {
  return {
    head: {
      vars: ["resource", "type"],
    },
    results: {
      bindings: edges.flatMap(edge => [
        ...edge.sourceTypes.map(sourceType => ({
          resource: {
            type: "uri",
            value: edge.source,
          },
          type: {
            type: "uri",
            value: sourceType,
          },
        })),
        ...edge.targetTypes.map(targetType => ({
          resource: {
            type: "uri",
            value: edge.target,
          },
          type: {
            type: "uri",
            value: targetType,
          },
        })),
      ]),
    },
  };
}
