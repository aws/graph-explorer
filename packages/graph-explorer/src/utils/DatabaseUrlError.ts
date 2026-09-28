/**
 * Base for errors caused by a direct connection's database URL itself, so a
 * retry would most likely fail the same way. Records the URL for diagnostics.
 */
export class DatabaseUrlError extends Error {
  /** The database URL at fault. */
  url: string;

  constructor(message: string, url: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DatabaseUrlError";
    this.url = url;
    Object.setPrototypeOf(this, DatabaseUrlError.prototype);
  }
}
