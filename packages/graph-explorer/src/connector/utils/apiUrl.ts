import { STATIC_MOUNT_PATH } from "@shared/constants";

import { env, ReverseProxyMisconfiguredError } from "@/utils";

/**
 * Resolves an API endpoint path against the app's own origin.
 *
 * The proxy server mounts the client's static files at `STATIC_MOUNT_PATH`
 * and every API route at the root, so the API root is the document's own
 * path with that segment cut out, at whatever prefix a reverse proxy adds.
 */
export function apiUrl(endpoint: string): URL {
  const url = new URL(
    `${resolveApiRoot(location.pathname)}${endpoint}`,
    location.origin,
  );
  // A path starting with "//" resolves as a network-path reference to
  // another host.
  if (url.origin !== location.origin) {
    throw new ReverseProxyMisconfiguredError(location.pathname);
  }
  return url;
}

/**
 * Cuts the last whole static mount segment out of the document's path, so a
 * deployment prefix that also contains it still resolves correctly and a
 * lookalike such as `/explorer-ui/` does not match. The one exception is the
 * document root in dev mode, where Vite serves the app at `/` with no mount
 * segment and the document's own root is the API root. Any other path
 * without the mount segment means a reverse proxy renamed it away, which
 * would otherwise send every database request to the wrong place, so that
 * case throws instead of guessing.
 */
function resolveApiRoot(pathname: string): string {
  if (env.DEV && pathname === "/") {
    return "/";
  }
  const segments = pathname.split("/");
  const mountIndex = segments.lastIndexOf(STATIC_MOUNT_PATH.slice(1));
  if (mountIndex === -1) {
    throw new ReverseProxyMisconfiguredError(pathname);
  }
  return `${segments.slice(0, mountIndex).join("/")}/`;
}
