import { vi } from "vitest";

import { createEdgeType, createVertexType } from "@/core";

import fetchEdgeConnections from ".";

describe("Gremlin > fetchEdgeConnections", () => {
  it("should return edge connections from response", async () => {
    const gremlinFetch = vi
      .fn()
      .mockResolvedValueOnce(routeResponse)
      .mockResolvedValueOnce(containsResponse);

    const result = await fetchEdgeConnections(gremlinFetch, {
      edgeTypes: [createEdgeType("route"), createEdgeType("contains")],
    });

    expect(gremlinFetch).toHaveBeenCalledTimes(2);
    expect(gremlinFetch).toHaveBeenCalledWith(
      expect.stringContaining('hasLabel("route")'),
    );
    expect(gremlinFetch).toHaveBeenCalledWith(
      expect.stringContaining('hasLabel("contains")'),
    );
    expect(result).toStrictEqual({
      edgeConnections: [
        {
          sourceVertexType: createVertexType("airport"),
          edgeType: createEdgeType("route"),
          targetVertexType: createVertexType("airport"),
        },
        {
          sourceVertexType: createVertexType("country"),
          edgeType: createEdgeType("contains"),
          targetVertexType: createVertexType("airport"),
        },
      ],
    });
  });

  it("should return empty array when no edge types provided", async () => {
    const gremlinFetch = vi.fn();

    const result = await fetchEdgeConnections(gremlinFetch, { edgeTypes: [] });

    expect(gremlinFetch).not.toHaveBeenCalled();
    expect(result).toStrictEqual({
      edgeConnections: [],
    });
  });

  it("should return empty array when no edge connections exist", async () => {
    const gremlinFetch = vi.fn().mockResolvedValue(emptyResponse);

    const result = await fetchEdgeConnections(gremlinFetch, {
      edgeTypes: [createEdgeType("route")],
    });

    expect(result).toStrictEqual({
      edgeConnections: [],
    });
  });

  it("should deduplicate edge connections within same edge type", async () => {
    const duplicateResponse = {
      requestId: "test-request-id",
      status: { message: "", code: 200 },
      result: {
        data: {
          "@type": "g:List",
          "@value": [
            {
              "@type": "g:Map",
              "@value": ["sourceType", "airport", "targetType", "airport"],
            },
            {
              "@type": "g:Map",
              "@value": ["sourceType", "airport", "targetType", "airport"],
            },
          ],
        },
      },
    };
    const gremlinFetch = vi.fn().mockResolvedValueOnce(duplicateResponse);

    const result = await fetchEdgeConnections(gremlinFetch, {
      edgeTypes: [createEdgeType("route")],
    });

    expect(result).toStrictEqual({
      edgeConnections: [
        {
          sourceVertexType: createVertexType("airport"),
          edgeType: createEdgeType("route"),
          targetVertexType: createVertexType("airport"),
        },
      ],
    });
  });

  it("should propagate errors from fetch", async () => {
    const gremlinFetch = vi.fn().mockRejectedValue(new Error("Network error"));

    await expect(
      fetchEdgeConnections(gremlinFetch, {
        edgeTypes: [createEdgeType("route")],
      }),
    ).rejects.toThrow("Network error");
  });

  it("should escape special characters in edge type", async () => {
    const gremlinFetch = vi.fn().mockResolvedValue(emptyResponse);

    await fetchEdgeConnections(gremlinFetch, {
      edgeTypes: [createEdgeType('edge"with"quotes')],
    });

    expect(gremlinFetch).toHaveBeenCalledWith(
      expect.stringContaining('hasLabel("edge\\"with\\"quotes")'),
    );
  });

  it("should handle Neptune multi-label vertices with :: delimiter", async () => {
    const multiLabelResponse = {
      requestId: "test-request-id",
      status: { message: "", code: 200 },
      result: {
        data: {
          "@type": "g:List",
          "@value": [
            {
              "@type": "g:Map",
              "@value": [
                "sourceType",
                "Person::Employee",
                "targetType",
                "Company::Organization",
              ],
            },
          ],
        },
      },
    };
    const gremlinFetch = vi.fn().mockResolvedValueOnce(multiLabelResponse);

    const result = await fetchEdgeConnections(gremlinFetch, {
      edgeTypes: [createEdgeType("worksAt")],
    });

    expect(result).toStrictEqual({
      edgeConnections: [
        {
          sourceVertexType: createVertexType("Person"),
          edgeType: createEdgeType("worksAt"),
          targetVertexType: createVertexType("Company"),
        },
        {
          sourceVertexType: createVertexType("Person"),
          edgeType: createEdgeType("worksAt"),
          targetVertexType: createVertexType("Organization"),
        },
        {
          sourceVertexType: createVertexType("Employee"),
          edgeType: createEdgeType("worksAt"),
          targetVertexType: createVertexType("Company"),
        },
        {
          sourceVertexType: createVertexType("Employee"),
          edgeType: createEdgeType("worksAt"),
          targetVertexType: createVertexType("Organization"),
        },
      ],
    });
  });
});

const routeResponse = {
  requestId: "test-request-id",
  status: { message: "", code: 200 },
  result: {
    data: {
      "@type": "g:List",
      "@value": [
        {
          "@type": "g:Map",
          "@value": ["sourceType", "airport", "targetType", "airport"],
        },
      ],
    },
  },
};

const containsResponse = {
  requestId: "test-request-id",
  status: { message: "", code: 200 },
  result: {
    data: {
      "@type": "g:List",
      "@value": [
        {
          "@type": "g:Map",
          "@value": ["sourceType", "country", "targetType", "airport"],
        },
      ],
    },
  },
};

const emptyResponse = {
  requestId: "test-request-id",
  status: { message: "", code: 200 },
  result: {
    data: {
      "@type": "g:List",
      "@value": [],
    },
  },
};
