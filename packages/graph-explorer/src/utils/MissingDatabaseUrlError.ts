/**
 * Thrown when a Connection's database URL is empty, so no request was sent.
 * Catches a misconfigured Connection before it reaches the Proxy Server,
 * which would otherwise reject the empty header and surface its raw
 * validation message to the user.
 */
export class MissingDatabaseUrlError extends Error {
  constructor() {
    super("This Connection has no database URL");
    this.name = "MissingDatabaseUrlError";
    Object.setPrototypeOf(this, MissingDatabaseUrlError.prototype);
  }
}
