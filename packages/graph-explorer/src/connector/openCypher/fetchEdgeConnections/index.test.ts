import { vi } from "vitest";

import { createEdgeType, createVertexType } from "@/core";

import fetchEdgeConnections from ".";

describe("openCypher > fetchEdgeConnections", () => {
  it("should return edge connections from response", async () => {
    const openCypherFetch = vi
      .fn()
      .mockResolvedValueOnce(routeResponse)
      .mockResolvedValueOnce(containsResponse);

    const result = await fetchEdgeConnections(openCypherFetch, {
      edgeTypes: [createEdgeType("route"), createEdgeType("contains")],
    });

    expect(openCypherFetch).toHaveBeenCalledTimes(2);
    expect(openCypherFetch).toHaveBeenCalledWith(
      expect.stringContaining("[e:`route`]"),
    );
    expect(openCypherFetch).toHaveBeenCalledWith(
      expect.stringContaining("[e:`contains`]"),
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
    const openCypherFetch = vi.fn();

    const result = await fetchEdgeConnections(openCypherFetch, {
      edgeTypes: [],
    });

    expect(openCypherFetch).not.toHaveBeenCalled();
    expect(result).toStrictEqual({
      edgeConnections: [],
    });
  });

  it("should return empty array when no edge connections exist", async () => {
    const openCypherFetch = vi.fn().mockResolvedValue(emptyResponse);

    const result = await fetchEdgeConnections(openCypherFetch, {
      edgeTypes: [createEdgeType("route")],
    });

    expect(result).toStrictEqual({
      edgeConnections: [],
    });
  });

  it("should handle empty label arrays gracefully", async () => {
    const openCypherFetch = vi.fn().mockResolvedValue(incompleteResponse);

    const result = await fetchEdgeConnections(openCypherFetch, {
      edgeTypes: [createEdgeType("route")],
    });

    // Empty label arrays produce no combinations, so only complete entries are included
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
    const openCypherFetch = vi
      .fn()
      .mockRejectedValue(new Error("Network error"));

    await expect(
      fetchEdgeConnections(openCypherFetch, {
        edgeTypes: [createEdgeType("route")],
      }),
    ).rejects.toThrow("Network error");
  });

  it("should deduplicate edge connections within same edge type", async () => {
    const duplicateResponse = {
      results: [
        { sourceLabels: ["airport"], targetLabels: ["airport"] },
        { sourceLabels: ["airport"], targetLabels: ["airport"] },
      ],
    };
    const openCypherFetch = vi.fn().mockResolvedValueOnce(duplicateResponse);

    const result = await fetchEdgeConnections(openCypherFetch, {
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

  it("should handle multi-label vertices", async () => {
    const multiLabelResponse = {
      results: [
        {
          sourceLabels: ["Person", "Employee"],
          targetLabels: ["Company", "Organization"],
        },
      ],
    };
    const openCypherFetch = vi.fn().mockResolvedValueOnce(multiLabelResponse);

    const result = await fetchEdgeConnections(openCypherFetch, {
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
  results: [
    {
      sourceLabels: ["airport"],
      targetLabels: ["airport"],
    },
  ],
};

const containsResponse = {
  results: [
    {
      sourceLabels: ["country"],
      targetLabels: ["airport"],
    },
  ],
};

const emptyResponse = {
  results: [],
};

const incompleteResponse = {
  results: [
    {
      sourceLabels: ["airport"],
      targetLabels: ["airport"],
    },
    {
      sourceLabels: [],
      targetLabels: ["airport"],
    },
    {
      sourceLabels: ["country"],
      targetLabels: [],
    },
  ],
};
