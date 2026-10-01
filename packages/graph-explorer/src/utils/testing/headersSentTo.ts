import { expect, type vi } from "vite-plus/test";

import { normalizeHeaders } from "./normalizeHeaders";

/**
 * The normalized headers of the call to `mockFetch` whose URL (string or
 * `URL`) matches `url`. Fails with a readable message when no call matches,
 * rather than the confusing "Cannot read properties of undefined" a plain
 * `.find(...)!` produces.
 */
export function headersSentTo(
  mockFetch: ReturnType<typeof vi.fn>,
  url: string,
): Record<string, string> {
  const call = mockFetch.mock.calls.find(([input]) => String(input) === url);
  expect(call, `no request to ${url}`).toBeDefined();
  return normalizeHeaders(call?.[1]?.headers);
}
