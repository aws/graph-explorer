import { vi } from "vitest";

import { createEdgeType, createVertexType } from "@/core";

import fetchEdgeConnections from ".";

describe("openCypher > fetchEdgeConnections", () => {
  it("should batch all edge types into a single request and regroup by edge type", async () => {
    const openCypherFetch = vi.fn().mockResolvedValueOnce(batchedResponse);

    const result = await fetchEdgeConnections(openCypherFetch, {
      edgeTypes: [createEdgeType("route"), createEdgeType("contains")],
    });

    expect(openCypherFetch).toHaveBeenCalledTimes(1);
    expect(openCypherFetch).toHaveBeenCalledWith(
      expect.stringContaining("[e:`route`]"),
    );
    expect(openCypherFetch).toHaveBeenCalledWith(
      expect.stringContaining("[e:`contains`]"),
    );
    expect(openCypherFetch).toHaveBeenCalledWith(
      expect.stringContaining("UNION ALL"),
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

  it("should split edge types into chunks of the batch size", async () => {
    const openCypherFetch = vi.fn().mockResolvedValue({ results: [] });
    const edgeTypes = Array.from({ length: 250 }, (_, i) =>
      createEdgeType(`edge${i}`),
    );

    await fetchEdgeConnections(openCypherFetch, { edgeTypes });

    // 250 types at a batch size of 100 => 3 requests
    expect(openCypherFetch).toHaveBeenCalledTimes(3);

    const queries = openCypherFetch.mock.calls.map(call => call[0] as string);
    // No request carries more than the batch size (one block per type)
    for (const q of queries) {
      expect((q.match(/RETURN DISTINCT/g) ?? []).length).toBeLessThanOrEqual(
        100,
      );
    }
    // Every input type is covered across the requests
    const all = queries.join("\n");
    for (const type of edgeTypes) {
      expect(all).toContain(`[e:\`${type}\`]`);
    }
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
        {
          edgeType: "route",
          sourceLabels: ["airport"],
          targetLabels: ["airport"],
        },
        {
          edgeType: "route",
          sourceLabels: ["airport"],
          targetLabels: ["airport"],
        },
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
          edgeType: "worksAt",
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

const batchedResponse = {
  results: [
    {
      edgeType: "route",
      sourceLabels: ["airport"],
      targetLabels: ["airport"],
    },
    {
      edgeType: "contains",
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
      edgeType: "route",
      sourceLabels: ["airport"],
      targetLabels: ["airport"],
    },
    {
      edgeType: "route",
      sourceLabels: [],
      targetLabels: ["airport"],
    },
    {
      edgeType: "route",
      sourceLabels: ["country"],
      targetLabels: [],
    },
  ],
};
