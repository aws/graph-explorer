import { vi } from "vitest";
import { SchemaResponse } from "../../useGEFetchTypes";
import fetchSchema from "./fetchSchema";

describe("OpenCypher > fetchSchema", () => {
  it("Should return a schema", async () => {
    const openCypherFetchFn = vi
      .fn()
      .mockResolvedValueOnce(allVertexLabelsResponse)
      .mockResolvedValueOnce(airportPropertiesResponse)
      .mockResolvedValueOnce(allEdgesResponse)
      .mockResolvedValueOnce(routeEdgePropertiesResponse)
      .mockResolvedValueOnce(containsEdgePropertiesResponse)
      .mockImplementation(query => {
        throw new Error(query);
      });

    const schema = await fetchSchema(openCypherFetchFn);

    const expected: SchemaResponse = {
      edges: [
        {
          attributes: [
            {
              dataType: "Number",
              displayLabel: "Dist",
              name: "dist",
            },
          ],
          displayLabel: "Route",
          total: 101064,
          type: "route",
        },
        {
          attributes: [],
          displayLabel: "Contains",
          total: 14012,
          type: "contains",
        },
      ],
      totalEdges: 115076,
      totalVertices: 3497,
      vertices: [
        {
          attributes: [
            {
              dataType: "String",
              displayLabel: "Desc",
              name: "desc",
            },
            {
              dataType: "Number",
              displayLabel: "Lon",
              name: "lon",
            },
            {
              dataType: "Number",
              displayLabel: "Runways",
              name: "runways",
            },
            {
              dataType: "String",
              displayLabel: "Type",
              name: "type",
            },
            {
              dataType: "String",
              displayLabel: "Last Update",
              name: "lastUpdate",
            },
            {
              dataType: "String",
              displayLabel: "Region",
              name: "region",
            },
            {
              dataType: "String",
              displayLabel: "Country",
              name: "country",
            },
            {
              dataType: "Number",
              displayLabel: "Lat",
              name: "lat",
            },
            {
              dataType: "Number",
              displayLabel: "Elev",
              name: "elev",
            },
            {
              dataType: "String",
              displayLabel: "Icao",
              name: "icao",
            },
            {
              dataType: "String",
              displayLabel: "City",
              name: "city",
            },
            {
              dataType: "String",
              displayLabel: "Code",
              name: "code",
            },
            {
              dataType: "Number",
              displayLabel: "Longest",
              name: "longest",
            },
          ],
          displayLabel: "Airport",
          total: 3497,
          type: "airport",
        },
      ],
    };

    expect(schema).toStrictEqual(expected);
  });

  it("Should handle vertex with empty string label in response object", async () => {
    const allVertexLabelsResponseEmpty = {
      results: [
        {
          label: "",
          count: 101064,
        },
        {
          label: "",
          count: 14012,
        },
      ],
    };
    const openCypherFetchFn = vi
      .fn()
      .mockResolvedValueOnce(allVertexLabelsResponseEmpty)
      .mockResolvedValueOnce(airportPropertiesResponse)
      .mockResolvedValueOnce(allEdgesResponse)
      .mockImplementation(query => {
        throw new Error(query);
      });

    const schema = await fetchSchema(openCypherFetchFn);
    expect(schema.vertices.length).toBe(0);
  });

  it("Should handle vertex with empty label array in response object", async () => {
    const allVertexLabelsResponseEmpty = {
      results: [
        {
          label: [],
          count: 101064,
        },
        {
          label: [],
          count: 14012,
        },
      ],
    };
    const openCypherFetchFn = vi
      .fn()
      .mockResolvedValueOnce(allVertexLabelsResponseEmpty)
      .mockResolvedValueOnce(airportPropertiesResponse)
      .mockResolvedValueOnce(allEdgesResponse)
      .mockImplementation(query => {
        throw new Error(query);
      });

    const schema = await fetchSchema(openCypherFetchFn);
    expect(schema.vertices.length).toBe(0);
  });

  it("Should handle vertex with undefined label in response object", async () => {
    const allVertexLabelsResponseEmpty = {
      results: [
        {
          label: undefined,
          count: 101064,
        },
        {
          label: undefined,
          count: 14012,
        },
      ],
    };
    const openCypherFetchFn = vi
      .fn()
      .mockResolvedValueOnce(allVertexLabelsResponseEmpty)
      .mockResolvedValueOnce(airportPropertiesResponse)
      .mockResolvedValueOnce(allEdgesResponse)
      .mockImplementation(query => {
        throw new Error(query);
      });

    const schema = await fetchSchema(openCypherFetchFn);
    expect(schema.vertices.length).toBe(0);
  });

  it("Should handle empty edge properties", async () => {
    const openCypherFetchFn = vi
      .fn()
      .mockResolvedValueOnce(allVertexLabelsResponse)
      .mockResolvedValueOnce(airportPropertiesResponse)
      .mockResolvedValueOnce(allEdgesResponse)
      .mockResolvedValueOnce({
        results: [],
      })
      .mockResolvedValueOnce(containsEdgePropertiesResponse)
      .mockImplementation(query => {
        throw new Error(query);
      });

    const schema = await fetchSchema(openCypherFetchFn);
    expect(schema).toBeDefined();
  });

  it("Should handle edges empty response object", async () => {
    const allEdgesResponseEmpty = {};
    const openCypherFetchFn = vi
      .fn()
      .mockResolvedValueOnce(allVertexLabelsResponse)
      .mockResolvedValueOnce(airportPropertiesResponse)
      .mockResolvedValueOnce(allEdgesResponseEmpty)
      .mockImplementation(query => {
        throw new Error(query);
      });

    const schema = await fetchSchema(openCypherFetchFn);
    expect(schema.edges.length).toBe(0);
  });

  it("Should handle edges with empty label array in response object", async () => {
    const allEdgesResponseEmpty = {
      results: [
        {
          label: [],
          count: 101064,
        },
        {
          label: [],
          count: 14012,
        },
      ],
    };
    const openCypherFetchFn = vi
      .fn()
      .mockResolvedValueOnce(allVertexLabelsResponse)
      .mockResolvedValueOnce(airportPropertiesResponse)
      .mockResolvedValueOnce(allEdgesResponseEmpty)
      .mockImplementation(query => {
        throw new Error(query);
      });

    const schema = await fetchSchema(openCypherFetchFn);
    expect(schema.edges.length).toBe(0);
  });

  it("Should handle edges with undefined label array in response object", async () => {
    const allEdgesResponseEmpty = {
      results: [
        {
          label: undefined,
          count: 101064,
        },
        {
          label: undefined,
          count: 14012,
        },
      ],
    };
    const openCypherFetchFn = vi
      .fn()
      .mockResolvedValueOnce(allVertexLabelsResponse)
      .mockResolvedValueOnce(airportPropertiesResponse)
      .mockResolvedValueOnce(allEdgesResponseEmpty)
      .mockImplementation(query => {
        throw new Error(query);
      });

    const schema = await fetchSchema(openCypherFetchFn);
    expect(schema.edges.length).toBe(0);
  });

  it("Should handle edges with empty string label array in response object", async () => {
    const allEdgesResponseEmpty = {
      results: [
        {
          label: "",
          count: 101064,
        },
        {
          label: "",
          count: 14012,
        },
      ],
    };
    const openCypherFetchFn = vi
      .fn()
      .mockResolvedValueOnce(allVertexLabelsResponse)
      .mockResolvedValueOnce(airportPropertiesResponse)
      .mockResolvedValueOnce(allEdgesResponseEmpty)
      .mockImplementation(query => {
        throw new Error(query);
      });

    const schema = await fetchSchema(openCypherFetchFn);
    expect(schema.edges.length).toBe(0);
  });

  it("Should handle response with missing edge label in attribute list", async () => {
    const routeEdgePropertiesResponseEmpty = {
      results: [
        {
          object: {
            "~id": "43549",
            "~entityType": "relationship",
            "~start": "1102",
            "~end": "2357",
            "~type": "route",
            "~properties": {
              dist: 123,
            },
          },
        },
      ],
    };

    const openCypherFetchFn = vi
      .fn()
      .mockResolvedValueOnce(allVertexLabelsResponse)
      .mockResolvedValueOnce(airportPropertiesResponse)
      .mockResolvedValueOnce(allEdgesResponse)
      .mockResolvedValueOnce(routeEdgePropertiesResponseEmpty)
      .mockResolvedValueOnce(containsEdgePropertiesResponse)
      .mockImplementation(query => {
        throw new Error(query);
      });

    const schema = await fetchSchema(openCypherFetchFn);
    expect(schema).toBeDefined();
  });

  it("Should handle edges property empty response object", async () => {
    const routeEdgePropertiesResponseEmpty = {};
    const openCypherFetchFn = vi
      .fn()
      .mockResolvedValueOnce(allVertexLabelsResponse)
      .mockResolvedValueOnce(airportPropertiesResponse)
      .mockResolvedValueOnce(allEdgesResponse)
      .mockResolvedValueOnce(routeEdgePropertiesResponseEmpty)
      .mockResolvedValueOnce(containsEdgePropertiesResponse)
      .mockImplementation(query => {
        throw new Error(query);
      });

    const schema = await fetchSchema(openCypherFetchFn);
    expect(schema).toBeDefined();
  });

  it("Should handle edges property malformed item", async () => {
    const allEdgesResponseMalformed = {
      results: [
        {
          label: "route",
        },
        {
          count: 14012,
        },
      ],
    };
    const openCypherFetchFn = vi
      .fn()
      .mockResolvedValueOnce(allVertexLabelsResponse)
      .mockResolvedValueOnce(airportPropertiesResponse)
      .mockResolvedValueOnce(allEdgesResponseMalformed)
      .mockResolvedValueOnce(routeEdgePropertiesResponse)
      .mockImplementation(query => {
        throw new Error(query);
      });

    const schema = await fetchSchema(openCypherFetchFn);
    expect(schema).toBeDefined();
    const routeEdge = schema.edges[0];
    expect(routeEdge.total).toBeUndefined();
    expect(schema.edges.length).toBe(1);
  });

  it("Should request properties for edges where labels are strings", async () => {
    const openCypherFetchFn = vi
      .fn()
      .mockResolvedValueOnce(allVertexLabelsResponse)
      .mockResolvedValueOnce(airportPropertiesResponse)
      .mockResolvedValueOnce(allEdgesResponse)
      .mockResolvedValueOnce(routeEdgePropertiesResponse)
      .mockResolvedValueOnce(containsEdgePropertiesResponse)
      .mockImplementation(query => {
        throw new Error(query);
      });

    await fetchSchema(openCypherFetchFn);

    expect(openCypherFetchFn.mock.calls[3][0]).toStrictEqual(
      "MATCH () -[e:`route`]- () RETURN e AS object LIMIT 1"
    );
    expect(openCypherFetchFn.mock.calls[4][0]).toStrictEqual(
      "MATCH () -[e:`contains`]- () RETURN e AS object LIMIT 1"
    );
  });

  it("Should request properties for edges where labels are arrays of strings", async () => {
    const openCypherFetchFn = vi
      .fn()
      .mockResolvedValueOnce(allVertexLabelsResponse)
      .mockResolvedValueOnce(airportPropertiesResponse)
      .mockResolvedValueOnce(allEdgesLabelsInArrayResponse)
      .mockResolvedValueOnce(routeEdgePropertiesResponse)
      .mockResolvedValueOnce(containsEdgePropertiesResponse)
      .mockImplementation(query => {
        throw new Error(query);
      });

    await fetchSchema(openCypherFetchFn);

    expect(openCypherFetchFn.mock.calls[3][0]).toStrictEqual(
      "MATCH () -[e:`route`]- () RETURN e AS object LIMIT 1"
    );
    expect(openCypherFetchFn.mock.calls[4][0]).toStrictEqual(
      "MATCH () -[e:`contains`]- () RETURN e AS object LIMIT 1"
    );
  });
});

const allVertexLabelsResponse = {
  results: [
    {
      label: ["airport"],
      count: 3497,
    },
  ],
};

const airportPropertiesResponse = {
  results: [
    {
      object: {
        "~id": "2357",
        "~entityType": "node",
        "~labels": ["airport"],
        "~properties": {
          desc: "Petersburg James A Johnson Airport",
          lon: -132.9450073,
          runways: 1,
          type: "airport",
          lastUpdate: "2018-01-01T00:00:00Z",
          region: "US-AK",
          country: "US",
          lat: 56.80170059,
          elev: 111,
          icao: "PAPG",
          city: "Petersburg",
          code: "PSG",
          longest: 6000,
        },
      },
    },
  ],
};

const allEdgesResponse = {
  results: [
    {
      label: "route",
      count: 101064,
    },
    {
      label: "contains",
      count: 14012,
    },
  ],
};

const allEdgesLabelsInArrayResponse = {
  results: [
    {
      label: ["route"],
      count: 101064,
    },
    {
      label: ["contains"],
      count: 14012,
    },
  ],
};

const routeEdgePropertiesResponse = {
  results: [
    {
      object: {
        "~id": "43549",
        "~entityType": "relationship",
        "~start": "1102",
        "~end": "2357",
        "~type": "route",
        "~properties": {
          dist: 123,
        },
      },
    },
  ],
};

const containsEdgePropertiesResponse = {
  results: [
    {
      object: {
        "~id": "56636",
        "~entityType": "relationship",
        "~start": "3729",
        "~end": "2357",
        "~type": "contains",
        "~properties": {},
      },
    },
  ],
};
