/**
 * Lowercases header names the way a spec-compliant `Headers` implementation
 * does when a request is actually sent. happy-dom's `Headers` preserves
 * whatever case the caller passed in, so a test asserting on a captured
 * `fetch` call's headers must normalize them first or it only proves
 * something about happy-dom, not about what the browser would send.
 */
export function normalizeHeaders(
  headers: Record<string, string> | undefined,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers ?? {}).map(([key, value]) => [
      key.toLowerCase(),
      value,
    ]),
  );
}
