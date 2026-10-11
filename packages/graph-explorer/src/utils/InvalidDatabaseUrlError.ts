import { z } from "zod";

import { DatabaseUrlError } from "./DatabaseUrlError";

/**
 * Thrown when a direct connection's database URL is not an absolute `http:`
 * or `https:` URL, so no request was sent. The browser would otherwise
 * resolve it against this page or treat a bare `host:port` as a scheme.
 */
export class InvalidDatabaseUrlError extends DatabaseUrlError {
  constructor(url: string) {
    super(
      "This direct Connection's database URL is not an absolute http or https URL",
      url,
    );
    this.name = "InvalidDatabaseUrlError";
    Object.setPrototypeOf(this, InvalidDatabaseUrlError.prototype);
  }
}

/** Whether the value parses as an absolute URL with an `http:` or `https:` protocol. */
export function isAbsoluteHttpUrl(value: string): boolean {
  return z.url({ protocol: /^https?$/ }).safeParse(value).success;
}
