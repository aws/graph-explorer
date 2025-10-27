import type { EdgeId } from "@/core";
import {
  createRandomEdgeForRdf,
  createRandomVertexForRdf,
} from "@/utils/testing";
import { edgeDetails } from "./edgeDetails";

describe("edgeDetails", () => {
  it("should return empty when request is empty", () => {
    const result = edgeDetails({ edgeIds: [] });
    expect(result.edges).toStrictEqual([]);
  });

  it("should return the edge details", () => {
    const edge = createRandomEdgeForRdf(
      createRandomVertexForRdf(),
      createRandomVertexForRdf()
    );
    const result = edgeDetails({ edgeIds: [edge.id] });
    expect(result.edges).toStrictEqual([edge]);
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

    expect(result.edges).toStrictEqual([edge1, edge2]);
  });

  it("should throw an error when the edge ID is not in the RDF edge ID format", () => {
    const edge = createRandomEdgeForRdf(
      createRandomVertexForRdf(),
      createRandomVertexForRdf()
    );
    // Missing the brackets
    edge.id = `${edge.sourceId}-${edge.type}->${edge.targetId}` as EdgeId;

    expect(() => edgeDetails({ edgeIds: [edge.id] })).toThrow(
      "Invalid RDF edge ID"
    );
  });
});
