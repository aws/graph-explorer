import { NetworkError } from "./NetworkError";

/** The database stopped a query because it ran longer than the database's own query timeout. */
export class DatabaseTimeoutError extends NetworkError {
  readonly databaseCode: string;

  constructor(
    message: string,
    statusCode: number,
    data: any,
    databaseCode: string,
  ) {
    super(message, statusCode, data);
    this.name = "DatabaseTimeoutError";
    this.databaseCode = databaseCode;
    Object.setPrototypeOf(this, DatabaseTimeoutError.prototype);
  }
}

/**
 * Codes that identify a database-side query timeout in an error response
 * body. Never key on HTTP status alone: several databases reuse the same
 * status for unrelated failures (memory limits, throttling, user
 * cancellation) that must not be classified as a query timeout.
 */
const DATABASE_TIMEOUT_CODES = new Set([
  // Neptune (Gremlin, openCypher, SPARQL): query exceeded the cluster's
  // configured query timeout.
  "TimeLimitExceededException",
  // Gremlin Server (TinkerPop): query exceeded evaluationTimeout. Captured
  // from a local `tinkerpop/gremlin-server` container; see
  // DatabaseTimeoutError.test.ts for the exact response body.
  "java.util.concurrent.TimeoutException",
]);

/**
 * Returns the database's own identifier for a query timeout from a decoded
 * error response body, or undefined if the body doesn't identify one.
 */
export function databaseTimeoutCode(data: unknown): string | undefined {
  if (data == null || typeof data !== "object") {
    return undefined;
  }

  const code =
    "code" in data
      ? data.code
      : "Exception-Class" in data
        ? data["Exception-Class"]
        : undefined;
  return typeof code === "string" && DATABASE_TIMEOUT_CODES.has(code)
    ? code
    : undefined;
}
