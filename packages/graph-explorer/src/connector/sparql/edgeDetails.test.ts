import { EdgeId } from "@/core";
import {
  createRandomEdgeForRdf,
  createRandomVertexForRdf,
} from "@/utils/testing";
import { edgeDetails } from "./edgeDetails";

describe("edgeDetails", () => {
  it("should return empty when request is empty", () => {
    const result = edgeDetails({ edgeIds: [] });
    expect(result.edges).toEqual([]);
  });

  it("should return the edge details", () => {
    const edge = createRandomEdgeForRdf(
      createRandomVertexForRdf(),
      createRandomVertexForRdf()
    );
    const result = edgeDetails({ edgeIds: [edge.id] });
    expect(result.edges).toEqual([edge]);
  });

  it("should return multiple details when request includes multiple IDs", () => {
    const edge1 = createRandomEdgeForRdf(
      createRandomVertexForRdf(),
      createRandomVertexForRdf()
    );
    const edge2 = createRandomEdgeForRdf(
      createRandomVertexForRdf(),
      createRandomVertexForRdf()
    );

    const result = edgeDetails({ edgeIds: [edge1.id, edge2.id] });

    expect(result.edges).toEqual([edge1, edge2]);
  });

  it("should not be fragment if the response does not include the properties", () => {
    const edge = createRandomEdgeForRdf(
      createRandomVertexForRdf(),
      createRandomVertexForRdf()
    );
    edge.attributes = {};
    edge.__isFragment = true;

    const result = edgeDetails({ edgeIds: [edge.id] });

    expect(result.edges[0]?.__isFragment).toBe(false);
  });

  it("should throw an error when the edge ID is not in the RDF edge ID format", () => {
    const edge = createRandomEdgeForRdf(
      createRandomVertexForRdf(),
      createRandomVertexForRdf()
    );
    // Missing the brackets
    edge.id = `${edge.source}-${edge.type}->${edge.target}` as EdgeId;

    expect(() => edgeDetails({ edgeIds: [edge.id] })).toThrow(
      "Invalid RDF edge ID"
    );
  });
});
