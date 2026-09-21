import { createEdgeType, type EdgeType } from "@/core";
import { DEFAULT_SAMPLE_SIZE } from "@/utils";

import {
  EDGE_TYPES_PER_CHUNK,
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
      expect(plan.requests).toHaveLength(2);
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

    it("should still use one unfiltered request when forced complete fits the budget", () => {
      const plan = planDiscovery({
        edgeTypes: edgeTypes(3),
        totalEdges: 20,
        discovery: "complete",
      });

      expect(plan.requests).toStrictEqual([{}]);
    });
  });
});
