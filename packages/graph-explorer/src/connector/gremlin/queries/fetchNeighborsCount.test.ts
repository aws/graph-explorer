import globalMockFetch from "../../testUtils/globalMockFetch";
import mockGremlinFetch from "../../testUtils/mockGremlinFetch";
import fetchNeighborsCount from "./fetchNeighborsCount";

describe("Gremlin > fetchNeighborsCount", () => {
  beforeAll(globalMockFetch);

  it("Should return neighbors counts for node 2018", async () => {
    const response = await fetchNeighborsCount(mockGremlinFetch(), {
      vertexId: "123",
    }, new Map());

    expect(response).toMatchObject({
      totalCount: 18,
      counts: { continent: 1, country: 1, airport: 16 },
    });
  });
});
