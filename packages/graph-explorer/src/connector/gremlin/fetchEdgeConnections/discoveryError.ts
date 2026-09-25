import type { EdgeConnectionDiscovery } from "@shared/types";

import { DatabaseTimeoutError, FetchTimeoutError, NetworkError } from "@/utils";

import type { DiscoveryStrategy } from "./discoveryPlan";

/** Neptune's code for a query that asked for more memory than the instance had. */
const MEMORY_LIMIT_ERROR_CODE = "MemoryLimitExceededException";

/** Whether the database gave up because one request asked for too much at once. */
export function isTooBig(error: unknown): boolean {
  return (
    error instanceof FetchTimeoutError ||
    error instanceof DatabaseTimeoutError ||
    memoryLimitCode(error) !== undefined
  );
}

/**
 * The database's own memory-limit code, from either shape the body arrives in.
 * Reading only the top level would miss a nested code and cost the degrade path
 * its fast exit, leaving the user to wait out the request bound instead.
 */
function memoryLimitCode(error: unknown): string | undefined {
  const data = error instanceof NetworkError ? error.data : undefined;
  const code = data?.code ?? data?.cause?.code;
  return code === MEMORY_LIMIT_ERROR_CODE ? code : undefined;
}

/**
 * Which side gave up. A fetch timeout is the connection's own bound running out,
 * fixed in the connection's settings; a database limit is the database itself
 * refusing the request, fixed in the database's configuration.
 */
export type FailureCause = "fetch-timeout" | "database-limit";

/** Classifies a size failure that `isTooBig` already confirmed. */
export function causeOf(error: unknown): FailureCause {
  return error instanceof FetchTimeoutError
    ? "fetch-timeout"
    : "database-limit";
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
  /** Which side gave up: the connection's fetch timeout, or the database itself. */
  cause: FailureCause;
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
      // Named apart from `cause`, which `createErrorDetails` reserves for the
      // serialized JS `Error.cause` and would otherwise overwrite this.
      failureCause: this.attempt.cause,
    };
  }
}

/**
 * Keyed on the setting and whether a complete scan was already abandoned, never
 * on the strategy: a forced complete is the only case with a setting to change,
 * and everything else has run out of cheaper options.
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

function describeRecovery({ setting, cause }: FailedDiscovery): string {
  if (cause === "fetch-timeout") {
    if (setting === "complete") {
      return "Switch Edge Connection Discovery to Automatic or Sampled in this connection's advanced options, because Automatic samples a graph this large instead of scanning it. Or raise the Fetch Timeout there, or clear it, since a complete scan may simply need longer than that allows.";
    }
    return "Raise the Fetch Timeout in this connection's advanced options, or clear it, since this request may simply need longer than that allows. Until then, the Schema view shows node types without the edge connections between them.";
  }
  if (setting === "complete") {
    return "Switch Edge Connection Discovery to Automatic or Sampled in this connection's advanced options, because Automatic samples a graph this large instead of scanning it.";
  }
  return "Raise the query timeout in the database configuration, such as the DB cluster parameter group for Neptune, or use an instance with more memory. Until then, the Schema view shows node types without the edge connections between them.";
}
