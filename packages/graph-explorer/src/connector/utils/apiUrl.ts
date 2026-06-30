/** Resolves an API endpoint path relative to the given baseURI.
 * The server mounts static files at `/explorer` and API routes at `/`,
 * so `../endpoint` from the static directory resolves to the API root. */
export function apiUrl(
  endpoint: string,
  baseURI: string = document.baseURI,
): URL {
  return new URL(`../${endpoint}`, baseURI);
}
