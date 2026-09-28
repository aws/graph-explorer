/**
 * Thrown when a direct connection's request failed and its URL is `http:` on
 * a host that isn't loopback while this page is served over `https:`, so the
 * browser most likely blocked it as mixed content. Wraps the original browser
 * `TypeError` as the `cause`.
 */
export class InsecureDatabaseUrlError extends Error {
  /** The URL the browser blocked. */
  url: string;

  constructor(url: string, cause: Error) {
    super(
      "This direct Connection's database URL is http, which the browser blocks on an https page",
      { cause },
    );
    this.name = "InsecureDatabaseUrlError";
    this.url = url;
    Object.setPrototypeOf(this, InsecureDatabaseUrlError.prototype);
  }
}

/**
 * Whether the browser treats a request from this page to `url` as mixed
 * content: an `http:` URL on a host that isn't loopback from an `https:` page.
 */
export function isMixedContent(url: URL): boolean {
  return (
    location.protocol === "https:" &&
    url.protocol === "http:" &&
    !isLoopbackHost(url.hostname)
  );
}

// Browsers treat these hosts as trustworthy, so an https page may still
// request them over http.
function isLoopbackHost(hostname: string): boolean {
  const host = hostname.replace(/\.$/, "");
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "[::1]" ||
    /^127(\.\d+){3}$/.test(host)
  );
}
