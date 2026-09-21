import { vi } from "vitest";

import { createEdgeType, createVertexType, type EdgeType } from "@/core";
import { NetworkError } from "@/utils";
import {
  createGInt64,
  createGMap,
  createGremlinResponse,
} from "@/utils/testing";

import fetchEdgeConnections from ".";

/** One distinct `(edge type, source label, target label)` combination. */
type Triple = [edgeType: string, sourceType: string, targetType: string];

/** Builds the flat `groupCount().by(project(...))` response: one g:Map of triple to count. */
function countResponse(...triples: Triple[]) {
  return createGremlinResponse(
    createGMap(
      new Map(
        triples.map(([e, s, t]) => [createGMap({ e, s, t }), createGInt64(1)]),
      ),
    ),
  );
}

/** A `groupCount()` over a graph with no matching edges returns an empty map. */
const emptyResponse = createGremlinResponse(createGMap({}));

function tooBigError(code: string) {
  return new NetworkError("Query cannot be completed", 500, { code });
}

function edgeTypes(count: number): EdgeType[] {
  return Array.from({ length: count }, (_, i) => createEdgeType(`edge${i}`));
}

describe("Gremlin > fetchEdgeConnections", () => {
  it("should ask for the distinct combinations in one request when the graph fits the budget", async () => {
    const gremlinFetch = vi
      .fn()
      .mockResolvedValueOnce(
        countResponse(
          ["route", "airport", "airport"],
          ["contains", "country", "airport"],
        ),
      );

    const result = await fetchEdgeConnections(
      gremlinFetch,
      {
        edgeTypes: [createEdgeType("route"), createEdgeType("contains")],
        totalEdges: 5_000,
      },
      "auto",
    );

    expect(gremlinFetch).toHaveBeenCalledTimes(1);
    expect(gremlinFetch).toHaveBeenCalledWith(
      expect.stringContaining("g.E()\n  .groupCount()"),
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

  it("should sample each edge type separately when the graph is too large to scan", async () => {
    const gremlinFetch = vi
      .fn()
      .mockResolvedValueOnce(countResponse(["route", "airport", "airport"]))
      .mockResolvedValueOnce(countResponse(["contains", "country", "airport"]));

    const result = await fetchEdgeConnections(
      gremlinFetch,
      {
        edgeTypes: [createEdgeType("route"), createEdgeType("contains")],
        totalEdges: 19_928_805,
      },
      "auto",
    );

    expect(gremlinFetch).toHaveBeenCalledTimes(2);
    expect(gremlinFetch).toHaveBeenCalledWith(
      expect.stringContaining("hasLabel('route').limit(10000)"),
    );
    expect(result.edgeConnections).toHaveLength(2);
  });

  it("should return nothing without querying when the schema has no edge types", async () => {
    const gremlinFetch = vi.fn();

    const result = await fetchEdgeConnections(
      gremlinFetch,
      { edgeTypes: [] },
      "auto",
    );

    expect(gremlinFetch).not.toHaveBeenCalled();
    expect(result).toStrictEqual({ edgeConnections: [] });
  });

  it("should return nothing when the graph has no edge connections", async () => {
    const gremlinFetch = vi.fn().mockResolvedValue(emptyResponse);

    const result = await fetchEdgeConnections(
      gremlinFetch,
      { edgeTypes: [createEdgeType("route")], totalEdges: 0 },
      "auto",
    );

    expect(result).toStrictEqual({ edgeConnections: [] });
  });

  it("should deduplicate combinations returned by more than one request", async () => {
    const gremlinFetch = vi
      .fn()
      .mockResolvedValue(countResponse(["route", "airport", "airport"]));

    const result = await fetchEdgeConnections(
      gremlinFetch,
      {
        edgeTypes: [createEdgeType("route"), createEdgeType("contains")],
        totalEdges: 19_928_805,
      },
      "auto",
    );

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

  it("should expand Neptune multi-label endpoints on both ends", async () => {
    const gremlinFetch = vi
      .fn()
      .mockResolvedValueOnce(
        countResponse(["worksAt", "Person::Employee", "Company::Organization"]),
      );

    const result = await fetchEdgeConnections(
      gremlinFetch,
      { edgeTypes: [createEdgeType("worksAt")], totalEdges: 10 },
      "auto",
    );

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

  it("should ignore edge types that are not in the schema", async () => {
    // An unfiltered scan sees every edge type in the graph, including ones the
    // schema does not know about and the app therefore cannot render.
    const gremlinFetch = vi
      .fn()
      .mockResolvedValueOnce(
        countResponse(
          ["route", "airport", "airport"],
          ["undiscovered", "airport", "airport"],
        ),
      );

    const result = await fetchEdgeConnections(
      gremlinFetch,
      { edgeTypes: [createEdgeType("route")], totalEdges: 10 },
      "auto",
    );

    expect(result.edgeConnections).toStrictEqual([
      {
        sourceVertexType: createVertexType("airport"),
        edgeType: createEdgeType("route"),
        targetVertexType: createVertexType("airport"),
      },
    ]);
  });

  it("should read the projected triple by key, whatever order the keys arrive in", async () => {
    // The whole reason the key is a named project() rather than a union() is that
    // Neptune's DFE engine permutes an unnamed key and silently inverts the edge
    // direction. Reading by name is what makes the shape safe, so pin it.
    const gremlinFetch = vi
      .fn()
      .mockResolvedValueOnce(
        createGremlinResponse(
          createGMap(
            new Map([
              [
                createGMap({ t: "airport", e: "contains", s: "country" }),
                createGInt64(1),
              ],
            ]),
          ),
        ),
      );

    const result = await fetchEdgeConnections(
      gremlinFetch,
      { edgeTypes: [createEdgeType("contains")], totalEdges: 10 },
      "auto",
    );

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
          new Map<
            ReturnType<typeof createGMap>,
            ReturnType<typeof createGInt64>
          >([
            [createGMap({ e: "route", s: "airport" }), createGInt64(1)],
            [
              createGMap({ e: "route", s: "airport", t: "airport" }),
              createGInt64(1),
            ],
          ]),
        ),
      ),
    );

    const result = await fetchEdgeConnections(
      gremlinFetch,
      { edgeTypes: [createEdgeType("route")], totalEdges: 10 },
      "auto",
    );

    expect(result.edgeConnections).toStrictEqual([
      {
        sourceVertexType: createVertexType("airport"),
        edgeType: createEdgeType("route"),
        targetVertexType: createVertexType("airport"),
      },
    ]);
  });

  describe("degrading a complete scan that was too large", () => {
    it.each(["MemoryLimitExceededException", "TimeLimitExceededException"])(
      "should redo discovery as sampled after %s",
      async code => {
        const gremlinFetch = vi
          .fn()
          .mockRejectedValueOnce(tooBigError(code))
          .mockResolvedValue(countResponse(["route", "airport", "airport"]));

        const result = await fetchEdgeConnections(
          gremlinFetch,
          { edgeTypes: [createEdgeType("route")], totalEdges: 10 },
          "auto",
        );

        expect(gremlinFetch).toHaveBeenCalledTimes(2);
        expect(gremlinFetch).toHaveBeenLastCalledWith(
          expect.stringContaining("hasLabel('route').limit(10000)"),
        );
        expect(result.edgeConnections).toHaveLength(1);
      },
    );

    it("should degrade when our own fetch timeout fires, which is all a non-Neptune engine gives us", async () => {
      const gremlinFetch = vi
        .fn()
        .mockRejectedValueOnce(
          new DOMException("The operation timed out", "TimeoutError"),
        )
        .mockResolvedValue(countResponse(["route", "airport", "airport"]));

      const result = await fetchEdgeConnections(
        gremlinFetch,
        { edgeTypes: [createEdgeType("route")], totalEdges: 10 },
        "auto",
      );

      expect(result.edgeConnections).toHaveLength(1);
    });

    it("should abandon the remaining chunks rather than finish them", async () => {
      const gremlinFetch = vi
        .fn()
        .mockRejectedValueOnce(tooBigError("MemoryLimitExceededException"))
        .mockResolvedValue(emptyResponse);

      const types = edgeTypes(500);
      await fetchEdgeConnections(
        gremlinFetch,
        { edgeTypes: types, totalEdges: 5_000_000 },
        "auto",
      );

      // 100 complete chunks were planned. The failure stops the pool, so only the
      // requests already in flight run before the 500 sampled requests.
      expect(gremlinFetch.mock.calls.length).toBeLessThan(types.length + 100);
      expect(gremlinFetch.mock.calls.length).toBeGreaterThanOrEqual(
        types.length + 1,
      );
    });

    it("should report the failure instead of sampling when the user forced complete", async () => {
      const gremlinFetch = vi
        .fn()
        .mockRejectedValue(tooBigError("MemoryLimitExceededException"));

      await expect(
        fetchEdgeConnections(
          gremlinFetch,
          { edgeTypes: [createEdgeType("route")], totalEdges: 10 },
          "complete",
        ),
      ).rejects.toThrow("Query cannot be completed");
    });

    it("should not degrade a sampled pass, because there is nothing cheaper to try", async () => {
      const gremlinFetch = vi
        .fn()
        .mockRejectedValue(tooBigError("MemoryLimitExceededException"));

      await expect(
        fetchEdgeConnections(
          gremlinFetch,
          { edgeTypes: [createEdgeType("route")], totalEdges: 19_928_805 },
          "auto",
        ),
      ).rejects.toThrow("Query cannot be completed");
      expect(gremlinFetch).toHaveBeenCalledTimes(1);
    });

    it("should propagate an error that is not about the query being too large", async () => {
      const gremlinFetch = vi
        .fn()
        .mockRejectedValue(new Error("Network error"));

      await expect(
        fetchEdgeConnections(
          gremlinFetch,
          { edgeTypes: [createEdgeType("route")], totalEdges: 10 },
          "auto",
        ),
      ).rejects.toThrow("Network error");
      expect(gremlinFetch).toHaveBeenCalledTimes(1);
    });

    it("should propagate a cancellation rather than treating it as a size problem", async () => {
      const gremlinFetch = vi
        .fn()
        .mockRejectedValue(new DOMException("Aborted", "AbortError"));

      await expect(
        fetchEdgeConnections(
          gremlinFetch,
          { edgeTypes: [createEdgeType("route")], totalEdges: 10 },
          "auto",
        ),
      ).rejects.toThrow("Aborted");
      expect(gremlinFetch).toHaveBeenCalledTimes(1);
    });
  });
});
