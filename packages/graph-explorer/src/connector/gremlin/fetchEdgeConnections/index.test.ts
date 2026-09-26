import { vi } from "vitest";

import { createEdgeType, createVertexType, type EdgeType } from "@/core";
import {
  createGInt64,
  createGList,
  createGMap,
  createGremlinResponse,
} from "@/utils/testing";

import fetchEdgeConnections from ".";

/** One distinct `(edge type, source labels, target labels)` combination. */
type Combination = [
  edgeType: string,
  sourceTypes: string[],
  targetTypes: string[],
];

/** Builds the `group().by(label())` response: edge type to `(s, t)` counts. */
function sampleResponse(...combinations: Combination[]) {
  const byEdgeType = new Map<string, Combination[]>();
  for (const combination of combinations) {
    const [edgeType] = combination;
    byEdgeType.set(edgeType, [
      ...(byEdgeType.get(edgeType) ?? []),
      combination,
    ]);
  }
  return createGremlinResponse(
    createGMap(
      new Map(
        [...byEdgeType].map(([edgeType, ofType]) => [
          edgeType,
          createGMap(
            new Map(
              ofType.map(([, s, t]) => [
                createGMap({ s: createGList(s), t: createGList(t) }),
                createGInt64(1),
              ]),
            ),
          ),
        ]),
      ),
    ),
  );
}

/** A `group()` over no edges returns an empty map. */
const emptyResponse = createGremlinResponse(createGMap({}));

function edgeTypes(count: number): EdgeType[] {
  return Array.from({ length: count }, (_, i) => createEdgeType(`edge${i}`));
}

describe("Gremlin > fetchEdgeConnections", () => {
  it("should sample several edge types in one request and regroup by edge type", async () => {
    const gremlinFetch = vi
      .fn()
      .mockResolvedValueOnce(
        sampleResponse(
          ["route", ["airport"], ["airport"]],
          ["contains", ["country"], ["airport"]],
        ),
      );

    const result = await fetchEdgeConnections(gremlinFetch, {
      edgeTypes: [createEdgeType("route"), createEdgeType("contains")],
    });

    expect(gremlinFetch).toHaveBeenCalledTimes(1);
    expect(gremlinFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "V().outE('route').limit(10000), V().outE('contains').limit(10000)",
      ),
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

  it("should send 10 edge types per request", async () => {
    const gremlinFetch = vi.fn().mockResolvedValue(emptyResponse);
    const types = edgeTypes(25);

    await fetchEdgeConnections(gremlinFetch, { edgeTypes: types });

    const queries = gremlinFetch.mock.calls.map(call => call[0] as string);
    expect(
      queries.map(q => (q.match(/outE\('edge\d+'\)/g) ?? []).length),
    ).toStrictEqual([10, 10, 5]);
    // Every input type is covered across the requests
    const all = queries.join("\n");
    for (const type of types) {
      expect(all).toContain(`outE('${type}')`);
    }
  });

  it("should return empty array when no edge types provided", async () => {
    const gremlinFetch = vi.fn();

    const result = await fetchEdgeConnections(gremlinFetch, { edgeTypes: [] });

    expect(gremlinFetch).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ edgeConnections: [] });
  });

  it("should return empty array when no edge connections exist", async () => {
    const gremlinFetch = vi.fn().mockResolvedValue(emptyResponse);

    const result = await fetchEdgeConnections(gremlinFetch, {
      edgeTypes: [createEdgeType("route")],
    });

    expect(result).toStrictEqual({ edgeConnections: [] });
  });

  it("should deduplicate combinations returned by more than one request", async () => {
    const gremlinFetch = vi
      .fn()
      .mockResolvedValue(sampleResponse(["route", ["airport"], ["airport"]]));

    const result = await fetchEdgeConnections(gremlinFetch, {
      // One more than a request carries, so it takes two.
      edgeTypes: [createEdgeType("route"), ...edgeTypes(10)],
    });

    expect(gremlinFetch).toHaveBeenCalledTimes(2);
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
    ).rejects.toThrow(new Error("Network error"));
  });

  it("should expand Neptune multi-label composites on both ends", async () => {
    const gremlinFetch = vi
      .fn()
      .mockResolvedValueOnce(
        sampleResponse([
          "worksAt",
          ["Person::Employee"],
          ["Company::Organization"],
        ]),
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

  it("should expand multi-label endpoints that arrive as one entry per label", async () => {
    // Neptune 1.3.5 emits each label of a multi-label vertex separately rather
    // than as one `::` composite. Keeping only the first would silently drop the
    // vertex's other types from the schema.
    const gremlinFetch = vi
      .fn()
      .mockResolvedValueOnce(
        sampleResponse(["worksAt", ["Person", "Employee"], ["Company"]]),
      );

    const result = await fetchEdgeConnections(gremlinFetch, {
      edgeTypes: [createEdgeType("worksAt")],
    });

    expect(result.edgeConnections).toStrictEqual([
      {
        sourceVertexType: createVertexType("Person"),
        edgeType: createEdgeType("worksAt"),
        targetVertexType: createVertexType("Company"),
      },
      {
        sourceVertexType: createVertexType("Employee"),
        edgeType: createEdgeType("worksAt"),
        targetVertexType: createVertexType("Company"),
      },
    ]);
  });

  it("should read the projected labels by key, whatever order the keys arrive in", async () => {
    const gremlinFetch = vi.fn().mockResolvedValueOnce(
      createGremlinResponse(
        createGMap(
          new Map([
            [
              "contains",
              createGMap(
                new Map([
                  [
                    // target-then-source key order
                    createGMap({
                      t: createGList(["airport"]),
                      s: createGList(["country"]),
                    }),
                    createGInt64(1),
                  ],
                ]),
              ),
            ],
          ]),
        ),
      ),
    );

    const result = await fetchEdgeConnections(gremlinFetch, {
      edgeTypes: [createEdgeType("contains")],
    });

    expect(result.edgeConnections).toStrictEqual([
      {
        sourceVertexType: createVertexType("country"),
        edgeType: createEdgeType("contains"),
        targetVertexType: createVertexType("airport"),
      },
    ]);
  });

  it("should skip combinations missing a projected label", async () => {
    const gremlinFetch = vi.fn().mockResolvedValueOnce(
      createGremlinResponse(
        createGMap(
          new Map([
            [
              "route",
              createGMap(
                new Map([
                  [
                    createGMap({ s: createGList(["airport"]) }),
                    createGInt64(1),
                  ],
                  [
                    createGMap({ t: createGList(["airport"]) }),
                    createGInt64(1),
                  ],
                  [
                    createGMap({
                      s: createGList(["airport"]),
                      t: createGList(["airport"]),
                    }),
                    createGInt64(1),
                  ],
                ]),
              ),
            ],
          ]),
        ),
      ),
    );

    const result = await fetchEdgeConnections(gremlinFetch, {
      edgeTypes: [createEdgeType("route")],
    });

    expect(result.edgeConnections).toStrictEqual([
      {
        sourceVertexType: createVertexType("airport"),
        edgeType: createEdgeType("route"),
        targetVertexType: createVertexType("airport"),
      },
    ]);
  });
});
