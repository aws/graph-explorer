import globalMockFetch from "@/connector/testUtils/globalMockFetch";
import mockGremlinFetch from "@/connector/testUtils/mockGremlinFetch";
import fetchNeighbors from ".";
import { VertexId } from "@/core";

describe("Gremlin > fetchNeighbors", () => {
  beforeEach(globalMockFetch);

  it("Should return all neighbors from node 2018", async () => {
    const expectedVertices = [
      {
        id: "486",
        type: "airport",
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
      },
      {
        id: "228",
        type: "airport",
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
      },
      {
        id: "124",
        type: "airport",
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
      },
      {
        id: "3741",
        type: "continent",
        types: ["continent"],
        attributes: { code: "EU", type: "continent", desc: "Europe" },
      },
      {
        id: "3701",
        type: "country",
        types: ["country"],
        attributes: { code: "ES", type: "country", desc: "Spain" },
      },
    ];

    const response = await fetchNeighbors(mockGremlinFetch(), {
      vertex: { id: "2018" as VertexId, idType: "string" },
      vertexType: "airport",
    });

    expect(response).toMatchObject({
      vertices: expectedVertices,
      edges: [
        {
          id: "49540",
          type: "route",
          source: "2018",
          sourceType: "airport",
          target: "486",
          targetType: "airport",
          attributes: { dist: 82 },
        },
        {
          id: "33133",
          type: "route",
          source: "486",
          sourceType: "airport",
          target: "2018",
          targetType: "airport",
          attributes: { dist: 82 },
        },
        {
          id: "49539",
          type: "route",
          source: "2018",
          sourceType: "airport",
          target: "228",
          targetType: "airport",
          attributes: { dist: 153 },
        },
        {
          id: "24860",
          type: "route",
          source: "228",
          sourceType: "airport",
          target: "2018",
          targetType: "airport",
          attributes: { dist: 153 },
        },
        {
          id: "49538",
          type: "route",
          source: "2018",
          sourceType: "airport",
          target: "124",
          targetType: "airport",
          attributes: { dist: 105 },
        },
        {
          id: "18665",
          type: "route",
          source: "124",
          sourceType: "airport",
          target: "2018",
          targetType: "airport",
          attributes: { dist: 105 },
        },
        {
          id: "59800",
          type: "contains",
          source: "3741",
          sourceType: "continent",
          target: "2018",
          targetType: "airport",
          attributes: {},
        },
        {
          id: "56297",
          type: "contains",
          source: "3701",
          sourceType: "country",
          target: "2018",
          targetType: "airport",
          attributes: {},
        },
      ],
    });
  });

  it("Should return filtered neighbors from node 2018", async () => {
    const expectedVertices = [
      {
        id: "486",
        type: "airport",
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
      },
      {
        id: "124",
        type: "airport",
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
      },
    ];

    const response = await fetchNeighbors(mockGremlinFetch(), {
      vertex: { id: "2018" as VertexId, idType: "string" },
      vertexType: "airport",
      filterByVertexTypes: ["airport"],
      filterCriteria: [{ name: "code", value: "TF", operator: "LIKE" }],
    });

    expect(response).toMatchObject({
      vertices: expectedVertices,
      edges: [
        {
          id: "49540",
          type: "route",
          source: "2018",
          sourceType: "airport",
          target: "486",
          targetType: "airport",
          attributes: { dist: 82 },
        },
        {
          id: "33133",
          type: "route",
          source: "486",
          sourceType: "airport",
          target: "2018",
          targetType: "airport",
          attributes: { dist: 82 },
        },
        {
          id: "49538",
          type: "route",
          source: "2018",
          sourceType: "airport",
          target: "124",
          targetType: "airport",
          attributes: { dist: 105 },
        },
        {
          id: "18665",
          type: "route",
          source: "124",
          sourceType: "airport",
          target: "2018",
          targetType: "airport",
          attributes: { dist: 105 },
        },
      ],
    });
  });
});
