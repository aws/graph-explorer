/** The request did not finish within the connection's fetch timeout. */
export class FetchTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number, cause: unknown) {
    super(
      `The request exceeded the fetch timeout of ${timeoutMs.toLocaleString()} ms.`,
      {
        cause,
      },
    );
    this.name = "FetchTimeoutError";
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, FetchTimeoutError.prototype);
  }
}
