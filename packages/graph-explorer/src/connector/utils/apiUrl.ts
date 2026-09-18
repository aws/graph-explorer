/** Resolves an API endpoint path relative to the document's baseURI.
 * The server mounts static files at `/explorer` and API routes at `/`,
 * so `../endpoint` from the static directory resolves to the API root. */
export function apiUrl(endpoint: string): URL {
  return new URL(`../${endpoint}`, document.baseURI);
}
