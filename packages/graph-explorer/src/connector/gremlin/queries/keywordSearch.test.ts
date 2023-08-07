import globalMockFetch from "../../testUtils/globalMockFetch";
import mockGremlinFetch from "../../testUtils/mockGremlinFetch";
import keywordSearch from "./keywordSearch";

describe("Gremlin > keywordSearch", () => {
  beforeAll(globalMockFetch);

  it("Should return 1 random node", async () => {
    const keywordResponse = await keywordSearch(mockGremlinFetch(), {
      limit: 1,
    }, new Map());

    expect(keywordResponse).toMatchObject({
      vertices: [
        {
          data: {
            id: "1",
            type: "airport",
            types: ["airport"],
            neighborsCount: 0,
            neighborsCountByType: {},
            attributes: {
              country: "US",
              longest: 12390,
              code: "ATL",
              city: "Atlanta",
              elev: 1026,
              icao: "KATL",
              lon: -84.4281005859375,
              runways: 5,
              region: "US-GA",
              type: "airport",
              lat: 33.6366996765137,
              desc: "Hartsfield - Jackson Atlanta International Airport",
            },
          },
        },
      ],
    });
  });

  it("Should return airports whose code matches with SFA", async () => {
    const keywordResponse = await keywordSearch(mockGremlinFetch(), {
      searchTerm: "SFA",
      vertexTypes: ["airport"],
      searchByAttributes: ["code"],
      searchById: false
    }, new Map());

    expect(keywordResponse).toMatchObject({
      vertices: [
        {
          data: {
            id: "836",
            type: "airport",
            types: ["airport"],
            neighborsCount: 0,
            neighborsCountByType: {},
            attributes: {
              country: "TN",
              longest: 9843,
              code: "SFA",
              city: "Sfax",
              elev: 85,
              icao: "DTTX",
              lon: 10.6909999847412,
              runways: 1,
              region: "TN-61",
              type: "airport",
              lat: 34.7179985046387,
              desc: "Sfax Thyna International Airport",
            },
          },
        },
      ],
    });
  });
});
