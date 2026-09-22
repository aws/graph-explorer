import { STATIC_MOUNT_PATH } from "@shared/constants";

import { ReverseProxyMisconfiguredError } from "@/utils";

/**
 * Resolves an API endpoint path against the app's own origin.
 *
 * The proxy server mounts the client's static files at `STATIC_MOUNT_PATH`
 * and every API route at the root. Cutting that segment out of the
 * document's own path, instead of resolving a relative URL against
 * `document.baseURI`, stays correct behind a reverse proxy that rewrites
 * the path but not the origin, whether or not the proxied path ends in a
 * trailing slash.
 */
export function apiUrl(endpoint: string): URL {
  return new URL(
    `${resolveApiRoot(location.pathname)}${endpoint}`,
    location.origin,
  );
}

/**
 * Cuts the static mount segment out of the document's path, using its last
 * occurrence so a deployment path that happens to contain that segment still
 * resolves correctly. The one exception is the document root itself: in dev
 * mode, Vite serves the app at `/` with no mount segment, and the document's
 * own root is the API root. Any other path without the mount segment means a
 * reverse proxy renamed it away, which would otherwise send every database
 * request to the wrong place, so that case throws instead of guessing.
 */
function resolveApiRoot(pathname: string): string {
  if (pathname === "/") {
    return "/";
  }
  const mountIndex = pathname.lastIndexOf(STATIC_MOUNT_PATH);
  if (mountIndex === -1) {
    throw new ReverseProxyMisconfiguredError(pathname);
  }
  return `${pathname.slice(0, mountIndex)}/`;
}
