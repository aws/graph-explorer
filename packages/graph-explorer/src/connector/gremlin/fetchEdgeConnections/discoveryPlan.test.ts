import { createEdgeType, type EdgeType } from "@/core";
import { DEFAULT_SAMPLE_SIZE } from "@/utils";

import {
  EDGE_TYPES_PER_CHUNK,
  LABEL_BUDGET_CHARS,
  COMPLETE_ATTEMPT_TIMEOUT_MS,
  planDiscovery,
  SCAN_BUDGET,
} from "./discoveryPlan";

function edgeTypes(count: number): EdgeType[] {
  return Array.from({ length: count }, (_, i) => createEdgeType(`edge${i}`));
}

/** Every edge type appears exactly once across the planned requests. */
function coveredTypes(requests: { edgeTypes?: EdgeType[] }[]) {
  return requests.flatMap(r => r.edgeTypes ?? []);
}

describe("Gremlin > planDiscovery", () => {
  it("should plan nothing when the schema has no edge types", () => {
    const plan = planDiscovery({
      edgeTypes: [],
      totalEdges: 1_000_000,
      discovery: "auto",
    });

    expect(plan).toStrictEqual({ strategy: "none", requests: [] });
  });

  describe("auto", () => {
    it("should scan the whole graph in one unfiltered request when it fits the budget", () => {
      const plan = planDiscovery({
        edgeTypes: edgeTypes(12),
        totalEdges: 40_000,
        discovery: "auto",
      });

      expect(plan).toStrictEqual({
        strategy: "complete",
        requests: [{}],
        requestTimeoutMs: COMPLETE_ATTEMPT_TIMEOUT_MS,
      });
    });

    it("should treat the budget as inclusive", () => {
      const plan = planDiscovery({
        edgeTypes: edgeTypes(3),
        totalEdges: SCAN_BUDGET,
        discovery: "auto",
      });

      expect(plan.strategy).toBe("complete");
      expect(plan.requests).toStrictEqual([{}]);
    });

    it("should sample when the graph is too large to scan but has few edge types", () => {
      const types = edgeTypes(3);
      const plan = planDiscovery({
        edgeTypes: types,
        totalEdges: 19_928_805,
        discovery: "auto",
      });

      expect(plan).toStrictEqual({
        strategy: "sampled",
        requests: types.map(type => ({
          edgeTypes: [type],
          limit: DEFAULT_SAMPLE_SIZE,
        })),
      });
    });

    it("should chunk a complete scan when there are more edge types than the scan is worth", () => {
      const types = edgeTypes(10_015);
      const plan = planDiscovery({
        edgeTypes: types,
        totalEdges: 68_582,
        discovery: "auto",
      });

      expect(plan.strategy).toBe("complete");
      // The edge count alone asks for 2 chunks. Naming 5,008 edge types in one
      // filter overruns the character budget, so it splits once more.
      expect(plan.requests).toHaveLength(3);
      expect(plan.requests.every(r => r.limit === undefined)).toBe(true);
      expect(coveredTypes(plan.requests)).toStrictEqual(types);
    });

    it("should chunk a complete scan for a graph that is both large and wide", () => {
      const types = edgeTypes(2_010);
      const plan = planDiscovery({
        edgeTypes: types,
        totalEdges: 1_015_639,
        discovery: "auto",
      });

      expect(plan.strategy).toBe("complete");
      expect(plan.requests).toHaveLength(21);
      expect(coveredTypes(plan.requests)).toStrictEqual(types);
    });
  });

  describe("auto with no recorded edge total", () => {
    it("should sample when there are few enough edge types to stay bounded", () => {
      const types = edgeTypes(3);
      const plan = planDiscovery({
        edgeTypes: types,
        totalEdges: undefined,
        discovery: "auto",
      });

      expect(plan).toStrictEqual({
        strategy: "sampled",
        requests: types.map(type => ({
          edgeTypes: [type],
          limit: DEFAULT_SAMPLE_SIZE,
        })),
      });
    });

    it("should chunk a complete scan by edge type when there are too many to sample", () => {
      const types = edgeTypes(10_015);
      const plan = planDiscovery({
        edgeTypes: types,
        totalEdges: undefined,
        discovery: "auto",
      });

      expect(plan.strategy).toBe("complete");
      expect(plan.requests).toHaveLength(
        Math.ceil(types.length / EDGE_TYPES_PER_CHUNK),
      );
      expect(coveredTypes(plan.requests)).toStrictEqual(types);
    });
  });

  describe("forced by the connection", () => {
    it("should sample every edge type when forced to sampled", () => {
      const types = edgeTypes(4);
      const plan = planDiscovery({
        edgeTypes: types,
        totalEdges: 20,
        discovery: "sampled",
      });

      expect(plan).toStrictEqual({
        strategy: "sampled",
        requests: types.map(type => ({
          edgeTypes: [type],
          limit: DEFAULT_SAMPLE_SIZE,
        })),
      });
    });

    it("should scan completely when forced to complete on a graph auto would sample", () => {
      const plan = planDiscovery({
        edgeTypes: edgeTypes(3),
        totalEdges: 19_928_805,
        discovery: "complete",
      });

      expect(plan.strategy).toBe("complete");
      expect(plan.requests.every(r => r.limit === undefined)).toBe(true);
    });

    it("should never plan more chunks than there are edge types", () => {
      const types = edgeTypes(3);
      const plan = planDiscovery({
        edgeTypes: types,
        totalEdges: 19_928_805,
        discovery: "complete",
      });

      expect(plan.requests).toHaveLength(3);
      expect(coveredTypes(plan.requests)).toStrictEqual(types);
    });

    it("should still use one unfiltered request when forced complete fits the budget", () => {
      const plan = planDiscovery({
        edgeTypes: edgeTypes(3),
        totalEdges: 20,
        discovery: "complete",
      });

      expect(plan.requests).toStrictEqual([{}]);
    });
  });

  describe("an edge total that is not a usable number", () => {
    // `totalEdges` is cast out of the summary API response and copied verbatim
    // from an imported connection file, so neither source guarantees a number.
    // A request naming zero edge types reads as "no filter" downstream, which is
    // the unbounded query this whole module exists to avoid.
    it.each([
      ["NaN", NaN],
      ["Infinity", Infinity],
      ["an object", {} as unknown as number],
      ["null", null as unknown as number],
      ["a negative count", -1],
      ["a string", "19928805" as unknown as number],
    ])(
      "should never plan an empty edge type filter for %s",
      (_label, total) => {
        const plan = planDiscovery({
          edgeTypes: edgeTypes(3),
          totalEdges: total,
          discovery: "auto",
        });

        for (const request of plan.requests) {
          expect(request.edgeTypes).not.toStrictEqual([]);
        }
      },
    );

    it("should decide as though the total were unrecorded", () => {
      const types = edgeTypes(3);
      const unusable = planDiscovery({
        edgeTypes: types,
        totalEdges: NaN,
        discovery: "auto",
      });
      const unrecorded = planDiscovery({
        edgeTypes: types,
        totalEdges: undefined,
        discovery: "auto",
      });

      expect(unusable).toStrictEqual(unrecorded);
    });
  });

  describe("bounding a complete attempt", () => {
    // Without a bound of its own, a complete attempt runs until the
    // connection-wide fetch timeout, which defaults to four minutes. The degrade
    // path only helps if the attempt gives up in seconds.
    it("should bound every automatic complete scan, chunked or not", () => {
      const whole = planDiscovery({
        edgeTypes: edgeTypes(3),
        totalEdges: 40_000,
        discovery: "auto",
      });
      const chunked = planDiscovery({
        edgeTypes: edgeTypes(2_010),
        totalEdges: 1_015_639,
        discovery: "auto",
      });

      expect(whole.requestTimeoutMs).toBe(COMPLETE_ATTEMPT_TIMEOUT_MS);
      expect(chunked.requestTimeoutMs).toBe(COMPLETE_ATTEMPT_TIMEOUT_MS);
    });

    it("should not bound a scan the user asked for, which has nothing to degrade to", () => {
      const plan = planDiscovery({
        edgeTypes: edgeTypes(3),
        totalEdges: 1_000_000,
        discovery: "complete",
      });

      expect(plan.requestTimeoutMs).toBeUndefined();
    });

    it("should not bound a sampled plan, whose work is already capped per request", () => {
      const plan = planDiscovery({
        edgeTypes: edgeTypes(3),
        totalEdges: 19_928_805,
        discovery: "auto",
      });

      expect(plan.requestTimeoutMs).toBeUndefined();
    });

    it("should bound a scan planned without an edge total, where the volume is a guess", () => {
      const plan = planDiscovery({
        edgeTypes: edgeTypes(10_015),
        totalEdges: undefined,
        discovery: "auto",
      });

      expect(plan.strategy).toBe("complete");
      expect(plan.requestTimeoutMs).toBe(COMPLETE_ATTEMPT_TIMEOUT_MS);
    });
  });

  describe("query size", () => {
    function longEdgeTypes(count: number, nameLength: number): EdgeType[] {
      return Array.from({ length: count }, (_, i) =>
        createEdgeType(`${String(i).padStart(nameLength, "t")}`),
      );
    }

    it("should keep the reported request count small for a graph with very many edge types", () => {
      const types = edgeTypes(10_015);
      const plan = planDiscovery({
        edgeTypes: types,
        totalEdges: 68_582,
        discovery: "auto",
      });

      // 3.2.2 issued 101 requests for this graph. The point of the change is
      // that the count comes from the work, not from the edge type count.
      expect(plan.requests.length).toBeLessThan(10);
      expect(coveredTypes(plan.requests)).toStrictEqual(types);
    });

    it("should split a chunk further when the edge type names are long", () => {
      const short = planDiscovery({
        edgeTypes: longEdgeTypes(10_000, 8),
        totalEdges: 200_000,
        discovery: "auto",
      });
      const long = planDiscovery({
        edgeTypes: longEdgeTypes(10_000, 400),
        totalEdges: 200_000,
        discovery: "auto",
      });

      // Same edge count and same edge type count, so the volume plan is
      // identical. Only the rendered query text differs.
      expect(long.requests.length).toBeGreaterThan(short.requests.length);
    });

    it("should hold every chunk inside the label budget", () => {
      const types = longEdgeTypes(5_000, 300);
      const plan = planDiscovery({
        edgeTypes: types,
        totalEdges: 500_000,
        discovery: "auto",
      });

      for (const request of plan.requests) {
        const rendered = (request.edgeTypes ?? []).reduce(
          (total, type) => total + type.length,
          0,
        );
        expect(rendered).toBeLessThanOrEqual(LABEL_BUDGET_CHARS);
      }
      expect(coveredTypes(plan.requests)).toStrictEqual(types);
    });
  });
});
