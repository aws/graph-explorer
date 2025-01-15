import globalMockFetch from "@/connector/testUtils/globalMockFetch";
import mockGremlinFetch from "@/connector/testUtils/mockGremlinFetch";
import fetchNeighborsCount from ".";
import { VertexId } from "@/@types/entities";

describe("Gremlin > fetchNeighborsCount", () => {
  beforeEach(globalMockFetch);

  it("Should return neighbors counts for node 2018", async () => {
    const response = await fetchNeighborsCount(mockGremlinFetch(), {
      vertex: {
        id: "123" as VertexId,
        idType: "string",
      },
    });

    expect(response).toMatchObject({
      totalCount: 18,
      counts: { continent: 1, country: 1, airport: 16 },
    });
  });
});
