import { BlockList, isIP } from "net";

import { embeddedIpv4Addresses } from "./embedded-ipv4.ts";
import { HttpError } from "./errors.ts";

// Only the ranges reserved for cloud provider services are refused. Other IPv4
// link-local addresses can host databases, such as rootless Podman's alias for
// the host machine, so they stay reachable. fe80::/10 stays refused
// whole, because a URL can't carry the zone a connection needs, so no database
// is reachable there. fd00:ec2::/64 is refused whole, since it holds no
// databases.
const blockedAddresses = new BlockList();
blockedAddresses.addSubnet("169.254.0.0", 24, "ipv4");
blockedAddresses.addAddress("169.254.42.42", "ipv4");
blockedAddresses.addSubnet("169.254.169.0", 24, "ipv4");
blockedAddresses.addSubnet("169.254.170.0", 24, "ipv4");
blockedAddresses.addAddress("100.100.100.200", "ipv4");
blockedAddresses.addSubnet("fe80::", 10, "ipv6");
blockedAddresses.addSubnet("fd00:ec2::", 64, "ipv6");

/**
 * True when the value is an IP address in the refused set above, or an IPv6
 * address that embeds one of its IPv4 addresses in a form
 * `embeddedIpv4Addresses` decodes. A host name is never blocked here.
 */
export function isBlockedAddress(address: string) {
  switch (isIP(address)) {
    case 4:
      return blockedAddresses.check(address, "ipv4");
    case 6: {
      const unzoned = address.replace(/%.*$/, "");
      // Translation prefixes stay usable, since IPv6-only networks reach IPv4
      // databases through them. Only the address they carry is checked.
      return (
        blockedAddresses.check(unzoned, "ipv6") ||
        embeddedIpv4Addresses(unzoned).some(ipv4 =>
          blockedAddresses.check(ipv4, "ipv4"),
        )
      );
    }
    default:
      return false;
  }
}

/** True when a URL host name is a blocked IP literal, bracketed or not. */
export function isBlockedHost(hostname: string) {
  return isBlockedAddress(hostname.replace(/^\[(.*)\]$/, "$1"));
}

const notPermittedHost =
  "a reserved cloud service or IPv6 link-local address, which is not a permitted database host. Edit the connection and change the Database URL to your database's address.";

/** The 403 for a database host that is a blocked IP literal. */
export function blockedLiteralError(origin: string) {
  return new HttpError(
    403,
    `Database origin "${origin}" is ${notPermittedHost}`,
  );
}

/** The 403 for a database host name that resolves to a blocked address. */
export function blockedResolutionError(origin: string) {
  return new HttpError(
    403,
    `Database origin "${origin}" resolves to ${notPermittedHost}`,
  );
}
