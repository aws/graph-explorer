import type { EdgeConnectionDiscovery } from "@shared/types";

import type { EdgeType } from "@/core";

import { DEFAULT_SAMPLE_SIZE } from "@/utils";

/**
 * Edges a single request is allowed to scan.
 *
 * The highest volume that never failed on any configuration we measured, not a
 * prediction of what is safe. The real ceiling moved by more than 4x between two
 * instances of the same hardware class, failing on memory at 150,000 edges with
 * Neptune's DFE engine and on time at 1,000,000 without it, and neither DFE
 * presence nor instance memory is visible from here. The degrade path, not this
 * number, is what gets an answer back when the guess is wrong. See the ADR.
 */
export const SCAN_BUDGET = 50_000;

/** Edge types per request when chunking a graph whose edge total is unknown. */
export const EDGE_TYPES_PER_CHUNK = 100;

/** Measured cost of one sampled request. Range seen across four engines: 0.9s to 1.8s. */
const PER_REQUEST_MS = 1_500;

/** Measured cost of scanning one edge, in microseconds. Range seen: 74 to 115. */
const PER_EDGE_SCAN_US = 85;

/** How long we are willing to spend when the edge total is unknown and we must guess. */
const UNKNOWN_TOTAL_BUDGET_MS = 60_000;

/**
 * Complete reads every edge and reports exact counts; sampled caps the edges it
 * reads per edge type and can miss a connection that occurs rarely. Chunking is
 * not a third strategy, it is complete split so no single request is too large.
 */
export type DiscoveryStrategy = "none" | "complete" | "sampled";

export type DiscoveryRequest = {
  /** Absent scans every edge type, which is cheaper than naming them all. */
  edgeTypes?: EdgeType[];
  /** Absent scans every matching edge. */
  limit?: number;
};

export type DiscoveryPlan = {
  strategy: DiscoveryStrategy;
  requests: DiscoveryRequest[];
};

/**
 * Chooses how to discover edge connections and lays out the requests it takes.
 *
 * Complete costs grow with the number of edges, sampled costs with the number of
 * edge types, so above the scan budget we take whichever quantity is smaller.
 * Pure, so the choice is testable without a database.
 *
 * @param totalEdges The graph's edge count, absent when the cached schema
 *   predates our recording it. Absence costs extra requests, never correctness.
 */
export function planDiscovery({
  edgeTypes,
  totalEdges,
  discovery,
}: {
  edgeTypes: EdgeType[];
  totalEdges: number | undefined;
  discovery: EdgeConnectionDiscovery;
}): DiscoveryPlan {
  if (edgeTypes.length === 0) {
    return { strategy: "none", requests: [] };
  }

  const sample =
    discovery === "sampled" ||
    (discovery === "auto" && shouldSample(edgeTypes.length, totalEdges));

  if (sample) {
    return {
      strategy: "sampled",
      requests: edgeTypes.map(type => ({
        edgeTypes: [type],
        limit: DEFAULT_SAMPLE_SIZE,
      })),
    };
  }

  return {
    strategy: "complete",
    requests: chunkForCompleteScan(edgeTypes, totalEdges),
  };
}

/** Whether sampling is the cheaper way to cover this graph. Only consulted on the automatic path. */
function shouldSample(
  edgeTypeCount: number,
  totalEdges: number | undefined,
): boolean {
  if (totalEdges === undefined) {
    // Decide on edge type count alone, preferring whichever stays bounded
    // whatever the graph turns out to be.
    return edgeTypeCount * PER_REQUEST_MS <= UNKNOWN_TOTAL_BUDGET_MS;
  }
  if (totalEdges <= SCAN_BUDGET) {
    return false;
  }
  const sampledMs = edgeTypeCount * PER_REQUEST_MS;
  const scanMs = (totalEdges * PER_EDGE_SCAN_US) / 1_000;
  return sampledMs <= scanMs;
}

/**
 * Splits a complete scan into requests small enough to land inside the budget.
 *
 * A scan that fits in one request drops the edge type filter: naming every type
 * would only make the query longer, and the caller discards anything outside the
 * schema anyway. Chunking cannot go finer than one edge type per request, so a
 * graph far above the budget with few edge types gets fewer, larger chunks than
 * the budget asks for — the case a forced complete is allowed to fail on.
 */
function chunkForCompleteScan(
  edgeTypes: EdgeType[],
  totalEdges: number | undefined,
): DiscoveryRequest[] {
  const wanted =
    totalEdges === undefined
      ? Math.ceil(edgeTypes.length / EDGE_TYPES_PER_CHUNK)
      : Math.ceil(totalEdges / SCAN_BUDGET);
  const chunkCount = Math.min(Math.max(wanted, 1), edgeTypes.length);

  if (chunkCount === 1) {
    return [{}];
  }

  const chunkSize = Math.ceil(edgeTypes.length / chunkCount);
  const requests: DiscoveryRequest[] = [];
  for (let start = 0; start < edgeTypes.length; start += chunkSize) {
    requests.push({ edgeTypes: edgeTypes.slice(start, start + chunkSize) });
  }
  return requests;
}
