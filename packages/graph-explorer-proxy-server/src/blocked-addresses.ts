import type { LookupFunction } from "net";

import dns from "dns";
import http from "http";
import https from "https";
import { BlockList, isIP } from "net";

import { embeddedIpv4Addresses } from "./embedded-ipv4.ts";
import { HttpError } from "./errors.ts";

// Only the ranges reserved for cloud provider services are refused. Other IPv4
// link-local addresses can host databases, such as rootless Podman's alias for
// the host machine, so they stay reachable. fd00:ec2::/64 is refused whole,
// since it holds no databases.
const reservedAddresses = new BlockList();
reservedAddresses.addSubnet("169.254.0.0", 24, "ipv4");
reservedAddresses.addAddress("169.254.42.42", "ipv4");
reservedAddresses.addSubnet("169.254.169.0", 24, "ipv4");
reservedAddresses.addSubnet("169.254.170.0", 24, "ipv4");
reservedAddresses.addAddress("100.100.100.200", "ipv4");
reservedAddresses.addSubnet("fd00:ec2::", 64, "ipv6");

// fe80::/10 is refused as a URL host, because a URL can't carry the zone a
// connection needs, so no database is reachable there. A resolved host name
// can still have a usable address beside it.
const ipv6LinkLocal = new BlockList();
ipv6LinkLocal.addSubnet("fe80::", 10, "ipv6");

function withoutZone(address: string) {
  return address.replace(/%.*$/, "");
}

/**
 * True when the value is an IP address in `reservedAddresses`, or an IPv6
 * address that embeds one of its IPv4 addresses in a form
 * `embeddedIpv4Addresses` decodes. A host name is never matched here.
 */
function isReservedAddress(address: string) {
  switch (isIP(address)) {
    case 4:
      return reservedAddresses.check(address, "ipv4");
    case 6: {
      const unzoned = withoutZone(address);
      // Translation prefixes stay usable, since IPv6-only networks reach IPv4
      // databases through them. Only the address they carry is checked.
      return (
        reservedAddresses.check(unzoned, "ipv6") ||
        embeddedIpv4Addresses(unzoned).some(ipv4 =>
          reservedAddresses.check(ipv4, "ipv4"),
        )
      );
    }
    default:
      return false;
  }
}

function isIpv6LinkLocal(address: string) {
  return (
    isIP(address) === 6 && ipv6LinkLocal.check(withoutZone(address), "ipv6")
  );
}

/**
 * True when the value is an IP address in the refused set: the ranges in
 * `reservedAddresses`, the embedded forms of their IPv4 addresses that
 * `embeddedIpv4Addresses` decodes, and IPv6 link-local. A host name is never
 * blocked here.
 */
export function isBlockedAddress(address: string) {
  return isReservedAddress(address) || isIpv6LinkLocal(address);
}

/** True when a URL host name is a blocked IP literal, bracketed or not. */
export function isBlockedHost(hostname: string) {
  return isBlockedAddress(hostname.replace(/^\[(.*)\]$/, "$1"));
}

const refusedAddressKind =
  "a reserved cloud service or IPv6 link-local address";
const notPermittedHost = `${refusedAddressKind}, which is not a permitted database host.`;
const editTheConnection =
  "Edit the connection and change the Database URL to your database's address";

/** The 403 for a database host that is a blocked IP literal. */
export function blockedLiteralError(origin: string) {
  return new HttpError(
    403,
    `Database origin "${origin}" is ${notPermittedHost} ${editTheConnection}.`,
  );
}

/** The 403 for a database host name that resolves to a blocked address. */
export function blockedResolutionError(origin: string) {
  return new HttpError(
    403,
    `Database origin "${origin}" resolves to ${notPermittedHost} The server log names the address. ${editTheConnection}, or fix the host name's DNS records.`,
  );
}

/** The error code a request fails with when its host resolves to a blocked address. */
export const blockedLookupErrorCode = "ERR_BLOCKED_DB_ADDRESS";

/**
 * Resolves like `dns.lookup`, but fails when any resolved address is a
 * reserved address (see `isReservedAddress`), since the socket may try any
 * of them. IPv6 link-local answers are dropped and the rest used, and the
 * lookup fails only when none remains.
 */
export function guardedLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: Parameters<LookupFunction>[2],
) {
  dns.lookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) {
      callback(error, "");
      return;
    }
    function fail({ address }: dns.LookupAddress) {
      const blockedError: NodeJS.ErrnoException = new Error(
        `${hostname} resolves to ${address}, ${refusedAddressKind}`,
      );
      blockedError.code = blockedLookupErrorCode;
      callback(blockedError, "");
    }

    const reserved = addresses.find(({ address }) =>
      isReservedAddress(address),
    );
    if (reserved) {
      fail(reserved);
      return;
    }
    const usable = addresses.filter(({ address }) => !isIpv6LinkLocal(address));
    if (usable.length === 0) {
      fail(addresses[0]);
      return;
    }
    if (options.all) {
      callback(null, usable);
      return;
    }
    const [first] = usable;
    callback(null, first.address, first.family);
  });
}

/**
 * The options for the database request agents: the settings of Node's
 * global agents, which they replace, plus the guarded lookup.
 */
export const dbAgentOptions: http.AgentOptions = {
  keepAlive: true,
  scheduling: "lifo",
  timeout: 5000,
  lookup: guardedLookup,
};
const httpAgent = new http.Agent(dbAgentOptions);
const httpsAgent = new https.Agent(dbAgentOptions);

/** The agent for a database request to the URL. */
export function dbAgentFor(url: URL): http.Agent {
  return url.protocol === "https:" ? httpsAgent : httpAgent;
}

/** True when a request failed because its host resolved to a blocked address. */
export function isBlockedLookupError(
  error: unknown,
): error is NodeJS.ErrnoException {
  return (
    error instanceof Error &&
    "code" in error &&
    error.code === blockedLookupErrorCode
  );
}
