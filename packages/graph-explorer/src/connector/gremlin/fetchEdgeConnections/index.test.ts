import { vi } from "vitest";

import { createEdgeType, createVertexType } from "@/core";
import {
  createGList,
  createGMap,
  createGremlinResponse,
} from "@/utils/testing";

import fetchEdgeConnections from ".";

/** A projected connection pair g:Map, source-then-target key order. */
function pair(sourceType: string, targetType: string) {
  return createGMap({ sourceType, targetType });
}

/**
 * Builds the grouped GraphSON response produced by
 * `group().by(label()).by(project(...).dedup().fold())`: a single g:Map keyed by
 * edge label, each value a g:List of connection-pair g:Maps.
 */
function groupResponse(groups: Record<string, Array<[string, string]>>) {
  return createGremlinResponse(
    createGMap(
      Object.fromEntries(
        Object.entries(groups).map(([edgeType, pairs]) => [
          edgeType,
          createGList(pairs.map(([s, t]) => pair(s, t))),
        ]),
      ),
    ),
  );
}

const emptyResponse = createGremlinResponse(createGMap({}));

describe("Gremlin > fetchEdgeConnections", () => {
  it("should batch all edge types into a single request and regroup by edge type", async () => {
    const gremlinFetch = vi.fn().mockResolvedValueOnce(
      groupResponse({
        route: [["airport", "airport"]],
        contains: [["country", "airport"]],
      }),
    );

    const result = await fetchEdgeConnections(gremlinFetch, {
      edgeTypes: [createEdgeType("route"), createEdgeType("contains")],
    });

    expect(gremlinFetch).toHaveBeenCalledTimes(1);
    expect(gremlinFetch).toHaveBeenCalledWith(
      expect.stringContaining("hasLabel('route', 'contains')"),
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
    const gremlinFetch = vi.fn().mockResolvedValue(emptyResponse);
    const edgeTypes = Array.from({ length: 250 }, (_, i) =>
      createEdgeType(`edge${i}`),
    );

    await fetchEdgeConnections(gremlinFetch, { edgeTypes });

    // 250 types at a batch size of 100 => 3 requests
    expect(gremlinFetch).toHaveBeenCalledTimes(3);

    const queries = gremlinFetch.mock.calls.map(call => call[0] as string);
    // No request carries more than the batch size
    for (const q of queries) {
      expect((q.match(/'edge\d+'/g) ?? []).length).toBeLessThanOrEqual(100);
    }
    // Every input type is covered across the requests
    const all = queries.join("\n");
    for (const type of edgeTypes) {
      expect(all).toContain(`'${type}'`);
    }
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
    const gremlinFetch = vi.fn().mockResolvedValueOnce(
      groupResponse({
        route: [
          ["airport", "airport"],
          ["airport", "airport"],
        ],
      }),
    );

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

  it("should handle Neptune multi-label vertices with :: delimiter", async () => {
    const gremlinFetch = vi.fn().mockResolvedValueOnce(
      groupResponse({
        worksAt: [["Person::Employee", "Company::Organization"]],
      }),
    );

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

  it("should handle reversed key order in the projected pair map", async () => {
    const gremlinFetch = vi.fn().mockResolvedValueOnce(
      createGremlinResponse(
        createGMap({
          contains: createGList([
            // target-then-source key order
            createGMap({ targetType: "airport", sourceType: "country" }),
          ]),
        }),
      ),
    );

    const result = await fetchEdgeConnections(gremlinFetch, {
      edgeTypes: [createEdgeType("contains")],
    });

    expect(result).toStrictEqual({
      edgeConnections: [
        {
          sourceVertexType: createVertexType("country"),
          edgeType: createEdgeType("contains"),
          targetVertexType: createVertexType("airport"),
        },
      ],
    });
  });

  it("should skip pairs with missing sourceType or targetType", async () => {
    const gremlinFetch = vi.fn().mockResolvedValueOnce(
      createGremlinResponse(
        createGMap({
          contains: createGList([
            createGMap({ sourceType: "airport" }),
            createGMap({ targetType: "airport" }),
            createGMap({ sourceType: "country", targetType: "airport" }),
          ]),
        }),
      ),
    );

    const result = await fetchEdgeConnections(gremlinFetch, {
      edgeTypes: [createEdgeType("contains")],
    });

    expect(result).toStrictEqual({
      edgeConnections: [
        {
          sourceVertexType: createVertexType("country"),
          edgeType: createEdgeType("contains"),
          targetVertexType: createVertexType("airport"),
        },
      ],
    });
  });
});
