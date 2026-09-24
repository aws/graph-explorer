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

/**
 * Edge types per request when chunking a graph whose edge total is unknown.
 *
 * Shares the value of `DEFAULT_BATCH_REQUEST_SIZE` and nothing else. That one is
 * a fan-out width for batching independent queries; this one is a guess at how
 * much of an unmeasured graph one scan can carry, and it moves with the cost
 * model in the ADR. Deduplicating them would tie two unrelated decisions
 * together.
 */
export const EDGE_TYPES_PER_CHUNK = 100;

/**
 * Characters of edge type names one request may name in its filter.
 *
 * The edge total says how many edges a request scans, not how much query text it
 * carries, so a graph with thousands of edge types needs its own bound. The
 * largest filter measured live was about 55,000 characters, 5,008 names of 11,
 * which completed in 7.1s on Neptune 1.4.7.0. Like the scan budget this is the
 * largest size known to work rather than the point where it breaks.
 */
export const LABEL_BUDGET_CHARS = 60_000;

/**
 * Edges one sampled request may read, counting every edge type it names as
 * though it reached the per-type limit.
 *
 * A branch that reaches the limit costs about a second on a small instance
 * whether it shares a request or not, so batching saves round trips, not reads.
 * Measured on Neptune 1.4.5.1 (db.t3.medium): 10 full branches took 9.7s, 100
 * took 116s, just under the query timeout, and left the instance refusing even a
 * single-type sample on memory for two minutes afterwards. The worst case is
 * assumed because a type's edge count is not known before it is read.
 *
 * It is also the most edges one request holds in memory at once, because the
 * sampled query groups by edge type and keeps each type's sample until it is
 * counted.
 */
export const SAMPLE_EDGE_BUDGET = 100_000;

/** Edge types per sampled request, derived so the worst case fits the sample budget. */
export const EDGE_TYPES_PER_SAMPLE = Math.max(
  1,
  Math.floor(SAMPLE_EDGE_BUDGET / DEFAULT_SAMPLE_SIZE),
);

/** Quotes and the separator each name costs on top of its own characters. */
const LABEL_OVERHEAD_CHARS = 4;

/**
 * Measured cost of sampling one edge type. Range seen across four engines: 0.9s
 * to 1.8s. Still charged per type, not per batched request, because a branch
 * that reaches the limit costs as much as the separate request it replaced.
 */
const PER_REQUEST_MS = 1_500;

/** Measured cost of scanning one edge, in microseconds. Range seen: 74 to 115. */
const PER_EDGE_SCAN_US = 85;

/** How long we are willing to spend when the edge total is unknown and we must guess. */
const UNKNOWN_TOTAL_BUDGET_MS = 60_000;

/**
 * How long one request of a complete scan may run before it is abandoned.
 *
 * Reading the whole scan budget costs 4.3s at the measured per-edge rate, and
 * 5.8s at the slowest rate seen, so this only fires on a request reading far more
 * than the budget asked for. Chunks are balanced by edge type count rather than
 * by edge count, so one chunk holding a dominant edge type is exactly that case.
 *
 * Below the 30 to 35 seconds at which Neptune failed in both reproductions, on
 * purpose: if the database's own error arrives first the bound has done nothing.
 */
export const COMPLETE_ATTEMPT_TIMEOUT_MS = 20_000;

/**
 * Complete reads every edge and reports exact counts; sampled caps the edges it
 * reads per edge type and can miss a connection that occurs rarely. Chunking is
 * not a third strategy, it is complete split so no single request is too large.
 */
export type DiscoveryStrategy = "none" | "complete" | "sampled";

/** Reads every matching edge. */
export type ScanRequest = {
  /** Absent scans every edge type, which is cheaper than naming them all. */
  edgeTypes?: EdgeType[];
};

/** Reads at most `limitPerType` edges of each named edge type, in one request. */
export type SampleRequest = {
  edgeTypes: EdgeType[];
  limitPerType: number;
};

export type DiscoveryRequest = ScanRequest | SampleRequest;

export type DiscoveryPlan = {
  strategy: DiscoveryStrategy;
  requests: DiscoveryRequest[];
  /**
   * How long one request may run before it is abandoned, when the plan can
   * predict its cost. Absent means the connection's own fetch timeout is the
   * only bound.
   */
  requestTimeoutMs?: number;
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

  const edgeTotal = toEdgeTotal(totalEdges);

  const sample =
    discovery === "sampled" ||
    (discovery === "auto" && shouldSample(edgeTypes.length, edgeTotal));

  if (sample) {
    return {
      strategy: "sampled",
      requests: chunkEdgeTypes(edgeTypes, EDGE_TYPES_PER_SAMPLE).map(chunk => ({
        edgeTypes: chunk,
        limitPerType: DEFAULT_SAMPLE_SIZE,
      })),
    };
  }

  const requests = chunkForCompleteScan(edgeTypes, edgeTotal);

  // Bounded only on the automatic path, where abandoning the attempt leads
  // somewhere. A forced complete has nothing to degrade to, so cutting it short
  // would just deny the user the scan they asked for.
  if (discovery === "auto") {
    return {
      strategy: "complete",
      requests,
      requestTimeoutMs: COMPLETE_ATTEMPT_TIMEOUT_MS,
    };
  }

  return { strategy: "complete", requests };
}

/**
 * Accepts an edge total only when it can actually size work, and treats anything
 * else as unrecorded.
 *
 * The declared type says `number | undefined`, but the value is cast out of the
 * summary API response and copied verbatim out of an imported connection file, so
 * neither source guarantees one. Arithmetic on a non-number yields `NaN`, which
 * compares false against every threshold and would send the planner down the
 * complete path with a chunk count it cannot use.
 */
export function toEdgeTotal(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
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
 * Splits a complete scan into requests that stay inside two independent bounds:
 * the edges one request may scan, and the characters its filter may name.
 *
 * A scan that fits in one request drops the filter entirely, so its query text is
 * a constant regardless of how many edge types the graph has. Beyond that every
 * request has to name its types, and the two bounds constrain different things:
 * the edge total says how much a request reads, the character budget says how
 * much it carries. Chunking cannot go finer than one edge type per request, so a
 * graph far above the scan budget with few edge types still gets chunks larger
 * than the budget asks for, which is the case a forced complete may fail on.
 */
function chunkForCompleteScan(
  edgeTypes: EdgeType[],
  totalEdges: number | undefined,
): ScanRequest[] {
  const wanted =
    totalEdges === undefined
      ? Math.ceil(edgeTypes.length / EDGE_TYPES_PER_CHUNK)
      : Math.ceil(totalEdges / SCAN_BUDGET);
  const chunkCount = Math.min(Math.max(wanted, 1), edgeTypes.length);

  if (chunkCount === 1) {
    return [{}];
  }

  return chunkEdgeTypes(
    edgeTypes,
    Math.ceil(edgeTypes.length / chunkCount),
  ).map(chunk => ({ edgeTypes: chunk }));
}

/**
 * Splits edge types into chunks of at most `maxPerChunk`, splitting early when a
 * chunk's names would overrun the label budget.
 */
function chunkEdgeTypes(
  edgeTypes: EdgeType[],
  maxPerChunk: number,
): EdgeType[][] {
  const chunks: EdgeType[][] = [];
  let chunk: EdgeType[] = [];
  let chars = 0;

  for (const edgeType of edgeTypes) {
    const cost = edgeType.length + LABEL_OVERHEAD_CHARS;
    const full =
      chunk.length >= maxPerChunk || chars + cost > LABEL_BUDGET_CHARS;
    if (chunk.length > 0 && full) {
      chunks.push(chunk);
      chunk = [];
      chars = 0;
    }
    chunk.push(edgeType);
    chars += cost;
  }
  // Only ever pushed non-empty, because a request naming zero edge types reads
  // downstream as no filter at all, which is the unbounded scan.
  if (chunk.length > 0) {
    chunks.push(chunk);
  }

  return chunks;
}
