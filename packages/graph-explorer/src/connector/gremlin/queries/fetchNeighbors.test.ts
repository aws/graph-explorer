import globalMockFetch from "../../testUtils/globalMockFetch";
import mockGremlinFetch from "../../testUtils/mockGremlinFetch";
import fetchNeighbors from "./fetchNeighbors";

describe("Gremlin > fetchNeighbors", () => {
  beforeAll(globalMockFetch);

  it("Should return all neighbors from node 2018", async () => {
    const expectedVertices = [
      {
        data: {
          id: "486",
          type: "airport",
          types: ["airport"],
          neighborsCount: 107,
          neighborsCountByType: { continent: 1, country: 1, airport: 105 },
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
      },
      {
        data: {
          id: "228",
          type: "airport",
          types: ["airport"],
          neighborsCount: 97,
          neighborsCountByType: { continent: 1, country: 1, airport: 95 },
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
      },
      {
        data: {
          id: "124",
          type: "airport",
          types: ["airport"],
          neighborsCount: 28,
          neighborsCountByType: { continent: 1, country: 1, airport: 26 },
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
      },
      {
        data: {
          id: "3741",
          type: "continent",
          types: ["continent"],
          neighborsCount: 605,
          neighborsCountByType: { airport: 605 },
          attributes: { code: "EU", type: "continent", desc: "Europe" },
        },
      },
      {
        data: {
          id: "3701",
          type: "country",
          types: ["country"],
          neighborsCount: 43,
          neighborsCountByType: { airport: 43 },
          attributes: { code: "ES", type: "country", desc: "Spain" },
        },
      },
    ];

    const response = await fetchNeighbors(mockGremlinFetch(), {
      vertexId: "2018",
      vertexType: "airport",
    }, new Map());

    expect(response).toMatchObject({
      vertices: expectedVertices.map(v => ({
        data: {
          ...v.data,
          neighborsCount: 0,
          neighborsCountByType: {},
        },
      })),
      edges: [
        {
          data: {
            id: "49540",
            type: "route",
            source: "2018",
            sourceType: "airport",
            target: "486",
            targetType: "airport",
            attributes: { dist: 82 },
          },
        },
        {
          data: {
            id: "49539",
            type: "route",
            source: "2018",
            sourceType: "airport",
            target: "228",
            targetType: "airport",
            attributes: { dist: 153 },
          },
        },
        {
          data: {
            id: "49538",
            type: "route",
            source: "2018",
            sourceType: "airport",
            target: "124",
            targetType: "airport",
            attributes: { dist: 105 },
          },
        },
        {
          data: {
            id: "24860",
            type: "route",
            source: "228",
            sourceType: "airport",
            target: "2018",
            targetType: "airport",
            attributes: { dist: 153 },
          },
        },
        {
          data: {
            id: "18665",
            type: "route",
            source: "124",
            sourceType: "airport",
            target: "2018",
            targetType: "airport",
            attributes: { dist: 105 },
          },
        },
        {
          data: {
            id: "33133",
            type: "route",
            source: "486",
            sourceType: "airport",
            target: "2018",
            targetType: "airport",
            attributes: { dist: 82 },
          },
        },
        {
          data: {
            id: "59800",
            type: "contains",
            source: "3741",
            sourceType: "continent",
            target: "2018",
            targetType: "airport",
            attributes: {},
          },
        },
        {
          data: {
            id: "56297",
            type: "contains",
            source: "3701",
            sourceType: "country",
            target: "2018",
            targetType: "airport",
            attributes: {},
          },
        },
      ],
    });
  });

  it("Should return filtered neighbors from node 2018", async () => {
    const expectedVertices = [
      {
        data: {
          id: "486",
          type: "airport",
          types: ["airport"],
          neighborsCount: 107,
          neighborsCountByType: { continent: 1, country: 1, airport: 105 },
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
      },
      {
        data: {
          id: "124",
          type: "airport",
          types: ["airport"],
          neighborsCount: 28,
          neighborsCountByType: { continent: 1, country: 1, airport: 26 },
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
      },
    ];

    const response = await fetchNeighbors(mockGremlinFetch(), {
      vertexId: "2018",
      vertexType: "airport",
      filterByVertexTypes: ["airport"],
      filterCriteria: [{ name: "code", value: "TF", operator: "LIKE" }],
    }, new Map());

    expect(response).toMatchObject({
      vertices: expectedVertices.map(v => ({
        data: {
          ...v.data,
          neighborsCount: 0,
          neighborsCountByType: {},
        },
      })),
      edges: [
        {
          data: {
            id: "49540",
            type: "route",
            source: "2018",
            sourceType: "airport",
            target: "486",
            targetType: "airport",
            attributes: { dist: 82 },
          },
        },
        {
          data: {
            id: "49538",
            type: "route",
            source: "2018",
            sourceType: "airport",
            target: "124",
            targetType: "airport",
            attributes: { dist: 105 },
          },
        },
        {
          data: {
            id: "18665",
            type: "route",
            source: "124",
            sourceType: "airport",
            target: "2018",
            targetType: "airport",
            attributes: { dist: 105 },
          },
        },
        {
          data: {
            id: "33133",
            type: "route",
            source: "486",
            sourceType: "airport",
            target: "2018",
            targetType: "airport",
            attributes: { dist: 82 },
          },
        },
      ],
    });
  });
});
