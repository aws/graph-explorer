import globalMockFetch from "@/connector/testUtils/globalMockFetch";
import mockGremlinFetch from "@/connector/testUtils/mockGremlinFetch";
import fetchNeighborsCount from ".";
import { createVertexId } from "@/core";

describe("Gremlin > fetchNeighborsCount", () => {
  beforeEach(globalMockFetch);

  it("Should return neighbors counts for node 2018", async () => {
    const response = await fetchNeighborsCount(mockGremlinFetch(), {
      vertex: {
        id: createVertexId("123"),
      },
    });

    expect(response).toMatchObject({
      totalCount: 18,
      counts: { continent: 1, country: 1, airport: 16 },
    });
  });
});
