/**
 * Thrown when a direct connection's database URL is `http:` on a host that
 * isn't loopback while this page is served over `https:`, so no request was
 * sent. The browser would block the request as mixed content.
 */
export class InsecureDatabaseUrlError extends Error {
  /** The database URL the browser would block. */
  url: string;

  constructor(url: string) {
    super(
      "This direct Connection's database URL is http, which the browser blocks on an https page",
    );
    this.name = "InsecureDatabaseUrlError";
    this.url = url;
    Object.setPrototypeOf(this, InsecureDatabaseUrlError.prototype);
  }
}
