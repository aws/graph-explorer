/**
 * Thrown when the browser can't reach the database of a direct connection,
 * typically because the database is down or doesn't allow cross-origin
 * requests from this page. Wraps the original browser `TypeError` as the
 * `cause` and records the request URL for diagnostics.
 */
export class DatabaseUnreachableError extends Error {
  /** The URL that was being fetched when the connection failed. */
  url: string;

  constructor(url: string, cause: Error) {
    super("Unable to reach the database from the browser", { cause });
    this.name = "DatabaseUnreachableError";
    this.url = url;
    Object.setPrototypeOf(this, DatabaseUnreachableError.prototype);
  }
}
