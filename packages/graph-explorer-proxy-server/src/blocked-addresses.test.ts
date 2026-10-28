import { describe, expect, it } from "vite-plus/test";

import { isBlockedAddress } from "./blocked-addresses.ts";

describe("isBlockedAddress", () => {
  it.each([
    ["IPv4 start of the first reserved range", "169.254.0.0"],
    ["IPv4 inside the first reserved range", "169.254.0.23"],
    ["IPv4 end of the first reserved range", "169.254.0.255"],
    ["IPv4 single reserved address", "169.254.42.42"],
    ["IPv4 inside the second reserved range", "169.254.169.254"],
    ["IPv4 start of the second reserved range", "169.254.169.0"],
    ["IPv4 inside the third reserved range", "169.254.170.2"],
    ["IPv4 end of the third reserved range", "169.254.170.255"],
    ["IPv4 reserved shared address space address", "100.100.100.200"],
    ["IPv6 link-local", "fe80::1"],
    ["IPv6 reserved address", "fd00:ec2::254"],
    [
      "IPv6 reserved address, written out",
      "fd00:0ec2:0000:0000:0000:0000:0000:0254",
    ],
    [
      "IPv6 link-local, written out with a zone",
      "fe80:0000:0000:0000:0000:0000:1.25.255.1%eth0",
    ],
    [
      "IPv6 reserved address, written out with a zone",
      "fd00:0ec2:0000:0000:0000:0000:169.254.169.254%en0",
    ],
    ["IPv6 inside the reserved range, fd00:ec2::23", "fd00:ec2::23"],
    ["IPv4-mapped IPv6", "::ffff:169.254.169.254"],
    ["IPv4-compatible IPv6", "::169.254.169.254"],
    ["IPv6 inside the reserved range, fd00:ec2::253", "fd00:ec2::253"],
    ["IPv6 end of the reserved range", "fd00:ec2::ffff:ffff:ffff:ffff"],
  ])("blocks %s", (_, address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it.each([
    ["IPv4 private", "10.0.0.5"],
    ["IPv4 link-local, rootless Podman host alias", "169.254.1.2"],
    [
      "IPv4 link-local just before the single reserved address",
      "169.254.42.41",
    ],
    [
      "IPv4 link-local just before the second reserved range",
      "169.254.168.255",
    ],
    ["IPv4 link-local, VPC Lattice", "169.254.171.1"],
    ["IPv4 link-local, container bridge", "169.254.172.2"],
    ["IPv4 end of the link-local range", "169.254.255.255"],
    [
      "IPv4 beside the reserved shared address space address",
      "100.100.100.201",
    ],
    ["IPv4 private 172.16/12", "172.16.0.1"],
    ["IPv4 private 192.168/16", "192.168.1.1"],
    ["IPv4 loopback", "127.0.0.1"],
    ["IPv6 loopback", "::1"],
    ["IPv6 unique local just past the reserved range", "fd00:ec2:0:1::1"],
    ["IPv6 unique local", "fd00::5"],
    ["IPv6 unique local with a random global ID", "fd12:3456::1"],
    [
      "IPv4 private through the NAT64 well-known prefix, in hex",
      "64:ff9b::a00:5",
    ],
    ["a host name", "neptune.example.com"],
  ])("allows %s", (_, address) => {
    expect(isBlockedAddress(address)).toBe(false);
  });

  // 169.254.169.254 is a9fe:a9fe. Each form embeds it where its standard
  // places the IPv4 address.
  it.each([
    ["NAT64 well-known prefix", "64:ff9b::169.254.169.254"],
    ["NAT64 well-known prefix, in hex", "64:ff9b::a9fe:a9fe"],
    ["NAT64 well-known prefix, with a zone", "64:ff9b::169.254.169.254%eth0"],
    ["NAT64 local-use prefix as a /96", "64:ff9b:1::a9fe:a9fe"],
    ["NAT64 local-use prefix as a /64", "64:ff9b:1:0:a9:fea9:fe00:0"],
    ["NAT64 local-use prefix as a /56", "64:ff9b:1:a9:fe:a9fe::"],
    ["NAT64 local-use prefix as a /48", "64:ff9b:1:a9fe:a9:fe05::"],
    ["6to4", "2002:a9fe:a9fe::1"],
    ["Teredo server", "2001:0:a9fe:a9fe::1"],
    ["Teredo client", "2001:0:4136:e378:8000:63bf:5601:5601"],
    ["IPv4-translated", "::ffff:0:169.254.169.254"],
  ])("blocks a reserved address embedded in %s", (_, address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it.each([
    ["NAT64 well-known prefix", "64:ff9b::10.0.0.5"],
    ["NAT64 local-use prefix", "64:ff9b:1::a00:5"],
    ["6to4", "2002:a00:5::1"],
    ["Teredo", "2001:0:4136:e378:8000:63bf:f5ff:fffa"],
    ["IPv4-translated", "::ffff:0:10.0.0.5"],
  ])("allows a private address embedded in %s", (_, address) => {
    expect(isBlockedAddress(address)).toBe(false);
  });

  it("blocks a NAT64 local-use address when any IPv4 position reads as a reserved address", () => {
    // At the /56 position this carries 10.169.254.169. At the /64 position it
    // carries 169.254.169.0.
    expect(isBlockedAddress("64:ff9b:1:ab0a:a9:fea9::")).toBe(true);
  });

  it("allows a NAT64 local-use address where no IPv4 position holds a refused address", () => {
    expect(isBlockedAddress("64:ff9b:1:1234:a:a9fe:a00:0")).toBe(false);
  });

  it.each([
    ["IPv4-mapped, 169.254.0.23", "::ffff:169.254.0.23"],
    ["NAT64 well-known prefix, 169.254.42.42", "64:ff9b::a9fe:2a2a"],
    ["NAT64 well-known prefix, 100.100.100.200", "64:ff9b::6464:64c8"],
    ["NAT64 local-use prefix, 169.254.0.23", "64:ff9b:1::a9fe:17"],
    ["6to4, 100.100.100.200", "2002:6464:64c8::1"],
    [
      "NAT64 local-use prefix as a /48, 100.100.100.200",
      "64:ff9b:1:6464:64:c805::",
    ],
    [
      "NAT64 local-use prefix as a /56, 100.100.100.200",
      "64:ff9b:1:64:64:64c8::",
    ],
    [
      "NAT64 local-use prefix as a /64, 100.100.100.200",
      "64:ff9b:1:0:64:6464:c800:0",
    ],
    ["Teredo server, 100.100.100.200", "2001:0:6464:64c8::1"],
    ["Teredo server, 169.254.0.23", "2001:0:a9fe:17::1"],
    ["IPv4-translated, 169.254.42.42", "::ffff:0:169.254.42.42"],
    [
      "NAT64 local-use prefix as a /96, 100.100.100.200",
      "64:ff9b:1::6464:64c8",
    ],
    ["Teredo client, 100.100.100.200", "2001:0:4136:e378:8000:63bf:9b9b:9b37"],
    ["IPv4-compatible, 100.100.100.200", "::100.100.100.200"],
  ])("blocks a reserved address embedded in %s", (_, address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it.each([
    ["IPv4-mapped", "::ffff:169.254.1.2"],
    ["NAT64 well-known prefix", "64:ff9b::a9fe:102"],
    ["NAT64 local-use prefix", "64:ff9b:1::a9fe:102"],
    ["6to4", "2002:a9fe:102::1"],
    ["Teredo client", "2001:0:4136:e378:8000:63bf:5601:fefd"],
    ["IPv4-translated", "::ffff:0:169.254.171.1"],
  ])("allows a link-local address embedded in %s", (_, address) => {
    expect(isBlockedAddress(address)).toBe(false);
  });

  it("allows a global address whose low bits look like a link-local address", () => {
    expect(isBlockedAddress("2001:db8::a9fe:a9fe")).toBe(false);
  });
});
