import type { EdgeConnectionDiscovery } from "@shared/types";

import { NetworkError } from "@/utils";

import type { DiscoveryStrategy } from "./discoveryPlan";

/**
 * Neptune's codes for a query that needed more of the instance than it could
 * have. No other engine reports an equivalent, which is why a request timeout is
 * the primary trigger and these are only a fast path.
 */
const TOO_BIG_ERROR_CODES = [
  "MemoryLimitExceededException",
  "TimeLimitExceededException",
];

/** Whether the database gave up because one request asked for too much at once. */
export function isTooBig(error: unknown): boolean {
  const code = error instanceof NetworkError ? error.data?.code : undefined;
  if (typeof code === "string") {
    return TOO_BIG_ERROR_CODES.includes(code);
  }
  // A request timeout, which is the only size signal a non-Neptune engine gives
  // us. A user-initiated cancellation raises `AbortError` and must not look like
  // a size problem.
  return error instanceof DOMException && error.name === "TimeoutError";
}

/** What edge connection discovery had already tried when it gave up. */
export type FailedDiscovery = {
  strategy: DiscoveryStrategy;
  /** The connection's setting, which decides whether anything cheaper was allowed. */
  setting: EdgeConnectionDiscovery;
  requests: number;
  totalEdges: number | undefined;
  /** A complete scan was already abandoned as too large before this attempt. */
  degraded: boolean;
};

/**
 * Edge connection discovery has nothing cheaper left to try.
 *
 * Thrown only for a size failure, so the error reaches the user carrying the one
 * thing the generic wording cannot give them: which recovery path is open. Other
 * failures propagate untouched, because the existing display branches already
 * read a refused connection or a bad URL correctly.
 */
export class EdgeConnectionDiscoveryError extends Error {
  readonly attempt: FailedDiscovery;
  /** What the user can do about it, in the order worth trying. */
  readonly recovery: string;

  constructor(attempt: FailedDiscovery, cause: unknown) {
    super(describeFailure(attempt), { cause });
    // A literal rather than the class name, because the production build
    // minifies class names and the error details dialog shows this.
    this.name = "EdgeConnectionDiscoveryError";
    this.attempt = attempt;
    this.recovery = describeRecovery(attempt);
  }

  /** Structured context for the error details dialog. */
  get details() {
    return {
      strategy: this.attempt.strategy,
      setting: this.attempt.setting,
      requests: this.attempt.requests,
      totalEdges: this.attempt.totalEdges,
      completeScanAbandoned: this.attempt.degraded,
    };
  }
}

/**
 * Both halves are keyed on the setting and whether a complete scan was already
 * abandoned, never on the strategy: a forced complete is the only case with a
 * setting to change, and everything else has run out of cheaper options.
 */
function describeFailure({ setting, degraded }: FailedDiscovery): string {
  if (setting === "complete") {
    return "The database could not read every edge in the graph, which is what complete edge connection discovery asks of it.";
  }
  if (degraded) {
    return "The database could not discover edge connections either way. Scanning every edge was too large, and sampling each edge type failed as well.";
  }
  return "The database could not sample the edges of each edge type to discover edge connections.";
}

function describeRecovery({ setting, degraded }: FailedDiscovery): string {
  if (setting === "complete") {
    return "Change Edge Connection Discovery to Automatic or Sampled in this connection's advanced options. Automatic samples a graph this large instead of scanning it.";
  }
  const alreadyTried = degraded ? " Sampling was already tried." : "";
  return `Raise the query timeout in the DB cluster parameter group, or use an instance with more memory.${alreadyTried} The Schema view still lists node types and edge types without this.`;
}
