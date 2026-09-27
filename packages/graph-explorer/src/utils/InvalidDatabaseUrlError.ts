import { z } from "zod";

/**
 * Thrown when a direct connection's database URL is not an absolute `http:`
 * or `https:` URL, so no request was sent. The browser would otherwise
 * resolve it against this page or treat a bare `host:port` as a scheme.
 */
export class InvalidDatabaseUrlError extends Error {
  /** The database URL that failed validation. */
  url: string;

  constructor(url: string) {
    super(
      "This direct Connection's database URL is not an absolute http or https URL",
    );
    this.name = "InvalidDatabaseUrlError";
    this.url = url;
    Object.setPrototypeOf(this, InvalidDatabaseUrlError.prototype);
  }
}

/** Whether the value parses as an absolute URL with an `http:` or `https:` protocol. */
export function isAbsoluteHttpUrl(value: string): boolean {
  return z.url({ protocol: /^https?$/ }).safeParse(value).success;
}
