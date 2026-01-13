import { globalMockFetch } from "@/connector/testUtils/globalMockFetch";
import mockGremlinFetch from "@/connector/testUtils/mockGremlinFetch";
import { createVertex, createVertexId } from "@/core";

import keywordSearch from ".";

describe("Gremlin > keywordSearch", () => {
  it("Should return 1 random node", async () => {
    globalMockFetch("should-return-1-random-node.json");
    const keywordResponse = await keywordSearch(mockGremlinFetch(), {
      limit: 1,
    });

    expect(keywordResponse).toStrictEqual({
      vertices: [
        createVertex({
          id: createVertexId("1"),
          types: ["airport"],
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
        }),
      ],
    });
  });

  it("Should return airports whose code matches with SFA", async () => {
    globalMockFetch("should-return-airports-whose-code-matches-with-SFA.json");
    const keywordResponse = await keywordSearch(mockGremlinFetch(), {
      searchTerm: "SFA",
      vertexTypes: ["airport"],
      searchByAttributes: ["code"],
    });

    expect(keywordResponse).toStrictEqual({
      vertices: [
        createVertex({
          id: createVertexId("836"),
          types: ["airport"],
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
        }),
      ],
    });
  });
});
