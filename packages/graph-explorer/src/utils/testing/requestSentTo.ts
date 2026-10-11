import { expect, type vi } from "vitest";

import { normalizeHeaders } from "./normalizeHeaders";

// Fails with a readable message when no call matches, rather than the
// confusing "Cannot read properties of undefined" a plain `.find(...)!`
// produces.
function requestInitSentTo(mockFetch: ReturnType<typeof vi.fn>, url: string) {
  const call = mockFetch.mock.calls.find(([input]) => String(input) === url);
  expect(call, `no request to ${url}`).toBeDefined();
  return call?.[1];
}

/**
 * The normalized headers of the call to `mockFetch` whose URL (string or
 * `URL`) matches `url`.
 */
export function headersSentTo(
  mockFetch: ReturnType<typeof vi.fn>,
  url: string,
): Record<string, string> {
  return normalizeHeaders(requestInitSentTo(mockFetch, url)?.headers);
}

/** The body of the call to `mockFetch` whose URL (string or `URL`) matches `url`. */
export function bodySentTo(
  mockFetch: ReturnType<typeof vi.fn>,
  url: string,
): RequestInit["body"] {
  return requestInitSentTo(mockFetch, url)?.body;
}
