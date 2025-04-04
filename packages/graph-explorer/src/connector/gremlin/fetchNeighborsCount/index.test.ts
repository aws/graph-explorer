import { globalMockFetch } from "@/connector/testUtils/globalMockFetch";
import mockGremlinFetch from "@/connector/testUtils/mockGremlinFetch";
import fetchNeighborsCount from ".";
import { createVertexId } from "@/core";

describe("Gremlin > fetchNeighborsCount", () => {
  it("Should return neighbors counts for node 2018", async () => {
    globalMockFetch("should-return-neighbors-counts-for-node-123.json");
    const response = await fetchNeighborsCount(mockGremlinFetch(), {
      vertexId: createVertexId("123"),
    });

    expect(response).toMatchObject({
      totalCount: 18,
      counts: { continent: 1, country: 1, airport: 16 },
    });
  });
});
