import { globalMockFetch } from "@/connector/testUtils/globalMockFetch";
import mockGremlinFetch from "@/connector/testUtils/mockGremlinFetch";
import fetchNeighbors from ".";
import { createEdge, createVertex, createVertexId } from "@/core";

describe("Gremlin > fetchNeighbors", () => {
  it("Should return all neighbors from node 2018", async () => {
    globalMockFetch("should-return-all-neighbors-from-node-2018.json");
    const expectedVertices = [
      createVertex({
        id: "486",
        types: ["airport"],
        attributes: {
          country: "ES",
          longest: 10499,
          code: "TFS",
          city: "Tenerife Island",
          elev: 209,
          icao: "GCTS",
          lon: -16.5725002289,
          runways: 1,
          region: "ES-CN",
          type: "airport",
          lat: 28.044500351,
          desc: "Tenerife South Airport",
        },
      }),
      createVertex({
        id: "228",
        types: ["airport"],
        attributes: {
          country: "ES",
          longest: 10171,
          code: "LPA",
          city: "Gran Canaria",
          elev: 78,
          icao: "GCLP",
          lon: -15.3865995407104,
          runways: 2,
          region: "ES-CN",
          type: "airport",
          lat: 27.9319000244141,
          desc: "Gran Canaria Airport",
        },
      }),
      createVertex({
        id: "124",
        types: ["airport"],
        attributes: {
          country: "ES",
          longest: 11155,
          code: "TFN",
          city: "Tenerife",
          elev: 2076,
          icao: "GCXO",
          lon: -16.3414993286,
          runways: 1,
          region: "ES-CN",
          type: "airport",
          lat: 28.4827003479,
          desc: "Tenerife Norte Airport",
        },
      }),
      createVertex({
        id: "3741",
        types: ["continent"],
        attributes: { code: "EU", type: "continent", desc: "Europe" },
      }),
      createVertex({
        id: "3701",
        types: ["country"],
        attributes: { code: "ES", type: "country", desc: "Spain" },
      }),
    ];

    const response = await fetchNeighbors(mockGremlinFetch(), {
      vertexId: createVertexId("2018"),
      vertexTypes: ["airport"],
    });

    expect(response).toMatchObject({
      vertices: expectedVertices,
      edges: [
        createEdge({
          id: "49540",
          type: "route",
          source: "2018",
          target: "486",
          attributes: { dist: 82 },
        }),
        createEdge({
          id: "33133",
          type: "route",
          source: "486",
          target: "2018",
          attributes: { dist: 82 },
        }),
        createEdge({
          id: "49539",
          type: "route",
          source: "2018",
          target: "228",
          attributes: { dist: 153 },
        }),
        createEdge({
          id: "24860",
          type: "route",
          source: "228",
          target: "2018",
          attributes: { dist: 153 },
        }),
        createEdge({
          id: "49538",
          type: "route",
          source: "2018",
          target: "124",
          attributes: { dist: 105 },
        }),
        createEdge({
          id: "18665",
          type: "route",
          source: "124",
          target: "2018",
          attributes: { dist: 105 },
        }),
        createEdge({
          id: "59800",
          type: "contains",
          source: "3741",
          target: "2018",
        }),
        createEdge({
          id: "56297",
          type: "contains",
          source: "3701",
          target: "2018",
        }),
      ],
    });
  });

  it("Should return filtered neighbors from node 2018", async () => {
    globalMockFetch("should-return-filtered-neighbors-from-node-2018.json");
    const expectedVertices = [
      createVertex({
        id: "486",
        types: ["airport"],
        attributes: {
          country: "ES",
          longest: 10499,
          code: "TFS",
          city: "Tenerife Island",
          elev: 209,
          icao: "GCTS",
          lon: -16.5725002289,
          runways: 1,
          region: "ES-CN",
          type: "airport",
          lat: 28.044500351,
          desc: "Tenerife South Airport",
        },
      }),
      createVertex({
        id: "124",
        types: ["airport"],
        attributes: {
          country: "ES",
          longest: 11155,
          code: "TFN",
          city: "Tenerife",
          elev: 2076,
          icao: "GCXO",
          lon: -16.3414993286,
          runways: 1,
          region: "ES-CN",
          type: "airport",
          lat: 28.4827003479,
          desc: "Tenerife Norte Airport",
        },
      }),
    ];

    const response = await fetchNeighbors(mockGremlinFetch(), {
      vertexId: createVertexId("2018"),
      vertexTypes: ["airport"],
      filterByVertexTypes: ["airport"],
      filterCriteria: [{ name: "code", value: "TF", operator: "LIKE" }],
    });

    expect(response).toMatchObject({
      vertices: expectedVertices,
      edges: [
        createEdge({
          id: "49540",
          type: "route",
          source: "2018",
          target: "486",
          attributes: { dist: 82 },
        }),
        createEdge({
          id: "33133",
          type: "route",
          source: "486",
          target: "2018",
          attributes: { dist: 82 },
        }),
        createEdge({
          id: "49538",
          type: "route",
          source: "2018",
          target: "124",
          attributes: { dist: 105 },
        }),
        createEdge({
          id: "18665",
          type: "route",
          source: "124",
          target: "2018",
          attributes: { dist: 105 },
        }),
      ],
    });
  });
});
