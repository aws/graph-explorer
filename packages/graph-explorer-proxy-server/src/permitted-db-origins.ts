import { BlockList, isIP } from "net";

import { HttpError } from "./errors.ts";

// Link-local addresses are never graph databases. BlockList matches the
// IPv4-mapped IPv6 form of an IPv4 subnet, but not the deprecated
// IPv4-compatible form, so that one is listed separately.
const linkLocalAddresses = new BlockList();
linkLocalAddresses.addSubnet("169.254.0.0", 16, "ipv4");
linkLocalAddresses.addSubnet("::a9fe:0", 112, "ipv6");
linkLocalAddresses.addSubnet("fe80::", 10, "ipv6");

/**
 * True when the URL host is an IP literal in a link-local range. Host names
 * are not resolved.
 */
function isLinkLocalHost(url: URL) {
  const address = url.hostname.replace(/^\[(.*)\]$/, "$1");
  const family = isIP(address);
  return (
    family !== 0 &&
    linkLocalAddresses.check(address, family === 4 ? "ipv4" : "ipv6")
  );
}

/**
 * Throws {@link HttpError} 403 unless the proxy may forward to the URL's
 * origin. Link-local hosts are always refused; the Database Origin Allowlist
 * applies on top when one is configured.
 */
export function assertPermittedDbOrigin(
  url: string,
  allowedOrigins: Set<string> | undefined,
) {
  const parsed = new URL(url);
  const origin = parsed.origin;
  if (isLinkLocalHost(parsed)) {
    throw new HttpError(
      403,
      `Database origin "${origin}" is a link-local address, which is not a permitted database host. Edit the connection and change the Database URL to your database's address.`,
    );
  }
  if (allowedOrigins && !allowedOrigins.has(origin)) {
    throw new HttpError(
      403,
      `Database origin "${origin}" is not in the Database Origin Allowlist (PROXY_SERVER_ALLOWED_DB_ORIGINS). Contact your administrator.`,
    );
  }
}
