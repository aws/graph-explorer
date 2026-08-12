import { vi } from "vitest";

import type { SchemaResponse } from "@/connector/useGEFetchTypes";

import { ClientLoggerConnector } from "@/connector/LoggerConnector";
import { createEdgeType, createVertexType } from "@/core";
import { normalize } from "@/utils/testing";

import fetchSchema from ".";

describe("OpenCypher > fetchSchema", () => {
  it("Should return a schema", async () => {
    const openCypherFetchFn = vi
      .fn()
      .mockResolvedValueOnce(allVertexLabelsResponse)
      .mockResolvedValueOnce(airportPropertiesResponse)
      .mockResolvedValueOnce(allEdgesResponse)
      .mockResolvedValueOnce(batchedEdgePropertiesResponse)
      .mockImplementation(query => {
        throw new Error(query);
      });

    const schema = await fetchSchema(
      openCypherFetchFn,
      new ClientLoggerConnector(),
    );

    const expected: SchemaResponse = {
      edges: [
        {
          attributes: [
            {
              dataType: "Number",
              name: "dist",
            },
          ],
          total: 101064,
          type: createEdgeType("route"),
        },
        {
          attributes: [],
          total: 14012,
          type: createEdgeType("contains"),
        },
      ],
      totalEdges: 115076,
      totalVertices: 3497,
      vertices: [
        {
          attributes: [
            {
              dataType: "String",
              name: "desc",
            },
            {
              dataType: "Number",
              name: "lon",
            },
            {
              dataType: "Number",
              name: "runways",
            },
            {
              dataType: "String",
              name: "type",
            },
            {
              dataType: "Date",
              name: "lastUpdate",
            },
            {
              dataType: "String",
              name: "region",
            },
            {
              dataType: "String",
              name: "country",
            },
            {
              dataType: "Number",
              name: "lat",
            },
            {
              dataType: "Number",
              name: "elev",
            },
            {
              dataType: "String",
              name: "icao",
            },
            {
              dataType: "String",
              name: "city",
            },
            {
              dataType: "String",
              name: "code",
            },
            {
              dataType: "Number",
              name: "longest",
            },
          ],
          total: 3497,
          type: createVertexType("airport"),
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

    const schema = await fetchSchema(
      openCypherFetchFn,
      new ClientLoggerConnector(),
    );
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

    const schema = await fetchSchema(
      openCypherFetchFn,
      new ClientLoggerConnector(),
    );
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

    const schema = await fetchSchema(
      openCypherFetchFn,
      new ClientLoggerConnector(),
    );
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

    const schema = await fetchSchema(
      openCypherFetchFn,
      new ClientLoggerConnector(),
    );
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

    const schema = await fetchSchema(
      openCypherFetchFn,
      new ClientLoggerConnector(),
    );
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

    const schema = await fetchSchema(
      openCypherFetchFn,
      new ClientLoggerConnector(),
    );
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

    const schema = await fetchSchema(
      openCypherFetchFn,
      new ClientLoggerConnector(),
    );
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

    const schema = await fetchSchema(
      openCypherFetchFn,
      new ClientLoggerConnector(),
    );
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

    const schema = await fetchSchema(
      openCypherFetchFn,
      new ClientLoggerConnector(),
    );
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

    const schema = await fetchSchema(
      openCypherFetchFn,
      new ClientLoggerConnector(),
    );
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

    const schema = await fetchSchema(
      openCypherFetchFn,
      new ClientLoggerConnector(),
    );
    expect(schema).toBeDefined();
    const routeEdge = schema.edges[0];
    expect(routeEdge.total).toBeUndefined();
    expect(schema.edges.length).toBe(1);
  });

  it("Should sample all edge types in a single batched request when labels are strings", async () => {
    const openCypherFetchFn = vi
      .fn()
      .mockResolvedValueOnce(allVertexLabelsResponse)
      .mockResolvedValueOnce(airportPropertiesResponse)
      .mockResolvedValueOnce(allEdgesResponse)
      .mockResolvedValueOnce(batchedEdgePropertiesResponse)
      .mockImplementation(query => {
        throw new Error(query);
      });

    await fetchSchema(openCypherFetchFn, new ClientLoggerConnector());

    expect(normalize(openCypherFetchFn.mock.calls[3][0])).toBe(
      normalize(`
        MATCH () -[e:\`route\`]-> () RETURN e AS object LIMIT 1
        UNION ALL
        MATCH () -[e:\`contains\`]-> () RETURN e AS object LIMIT 1
      `),
    );
  });

  it("Should sample all edge types in a single batched request when labels are arrays of strings", async () => {
    const openCypherFetchFn = vi
      .fn()
      .mockResolvedValueOnce(allVertexLabelsResponse)
      .mockResolvedValueOnce(airportPropertiesResponse)
      .mockResolvedValueOnce(allEdgesLabelsInArrayResponse)
      .mockResolvedValueOnce(batchedEdgePropertiesResponse)
      .mockImplementation(query => {
        throw new Error(query);
      });

    await fetchSchema(openCypherFetchFn, new ClientLoggerConnector());

    expect(normalize(openCypherFetchFn.mock.calls[3][0])).toBe(
      normalize(`
        MATCH () -[e:\`route\`]-> () RETURN e AS object LIMIT 1
        UNION ALL
        MATCH () -[e:\`contains\`]-> () RETURN e AS object LIMIT 1
      `),
    );
  });

  it("Should batch attribute sampling into one request per DEFAULT_BATCH_REQUEST_SIZE labels", async () => {
    const labelCount = 250;
    const vertexLabels = Array.from(
      { length: labelCount },
      (_, i) => `Vertex${i}`,
    );
    const edgeLabels = Array.from({ length: labelCount }, (_, i) => `Edge${i}`);

    const openCypherFetchFn = vi
      .fn()
      .mockResolvedValueOnce({
        results: vertexLabels.map(label => ({ label, count: 1 })),
      })
      .mockResolvedValueOnce({ results: [] })
      .mockResolvedValueOnce({ results: [] })
      .mockResolvedValueOnce({ results: [] })
      .mockResolvedValueOnce({
        results: edgeLabels.map(label => ({ label, count: 1 })),
      })
      .mockResolvedValueOnce({ results: [] })
      .mockResolvedValueOnce({ results: [] })
      .mockResolvedValueOnce({ results: [] })
      .mockImplementation(query => {
        throw new Error(query);
      });

    await fetchSchema(openCypherFetchFn, new ClientLoggerConnector());

    // 250 labels / 100 per batch = 3 attribute requests each, plus the two
    // label-count queries = 8 requests total (not 250 + 250 + 2).
    expect(openCypherFetchFn).toHaveBeenCalledTimes(8);

    const firstVertexBatch = openCypherFetchFn.mock.calls[1][0] as string;
    expect(firstVertexBatch.match(/LIMIT 1/g)).toHaveLength(100);
    expect(firstVertexBatch).toContain("UNION ALL");
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

// One batched request returns a sample per edge type in a single `results` array.
const batchedEdgePropertiesResponse = {
  results: [
    routeEdgePropertiesResponse.results[0],
    containsEdgePropertiesResponse.results[0],
  ],
};
