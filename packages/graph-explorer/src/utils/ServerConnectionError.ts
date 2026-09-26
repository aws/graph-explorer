/**
 * Thrown when a fetch can't reach the Graph Explorer server, typically because
 * the server stopped or the tab is stale. Wraps the original browser
 * `TypeError` as the `cause` and records the request URL for diagnostics.
 */
export class ServerConnectionError extends Error {
  /** The URL that was being fetched when the connection failed. */
  url: string;

  constructor(url: string, cause: Error) {
    super("Unable to reach the server", { cause });
    this.name = "ServerConnectionError";
    this.url = url;
    Object.setPrototypeOf(this, ServerConnectionError.prototype);
  }
}
