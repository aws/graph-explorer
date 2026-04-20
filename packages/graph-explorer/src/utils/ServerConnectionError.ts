/**
 * Thrown when a fetch request fails to reach the server, typically due to the
 * server not running, an incorrect URL, or a CORS restriction. Wraps the
 * original browser `TypeError` as the `cause` and captures the request URL for
 * diagnostics.
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
