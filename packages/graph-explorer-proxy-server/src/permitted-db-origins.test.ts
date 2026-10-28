import { describe, expect, it } from "vite-plus/test";

import { HttpError } from "./errors.ts";
import { assertPermittedDbOrigin } from "./permitted-db-origins.ts";

describe("assertPermittedDbOrigin", () => {
  it("does nothing when allowlist is undefined (permissive)", () => {
    expect(() =>
      assertPermittedDbOrigin("https://neptune:8182", undefined),
    ).not.toThrow();
  });

  it("does nothing when the origin is in the allowlist", () => {
    const allowed = new Set(["https://neptune:8182"]);
    expect(() =>
      assertPermittedDbOrigin("https://neptune:8182/sparql", allowed),
    ).not.toThrow();
  });

  it("throws HttpError 403 when the origin is not in the allowlist", () => {
    const allowed = new Set(["https://neptune:8182"]);
    expect(() => assertPermittedDbOrigin("https://evil:9999", allowed)).toThrow(
      expect.objectContaining({
        status: 403,
        message: expect.stringContaining("https://evil:9999"),
      }),
    );
    expect(() => assertPermittedDbOrigin("https://evil:9999", allowed)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining("administrator"),
      }),
    );
  });

  it("is case insensitive (URL constructor normalizes)", () => {
    const allowed = new Set(["https://neptune:8182"]);
    expect(() =>
      assertPermittedDbOrigin("HTTPS://NEPTUNE:8182/gremlin", allowed),
    ).not.toThrow();
  });

  it("ignores trailing slashes (origin strips path)", () => {
    const allowed = new Set(["https://neptune:8182"]);
    expect(() =>
      assertPermittedDbOrigin("https://neptune:8182/", allowed),
    ).not.toThrow();
  });

  it("treats different ports as different origins", () => {
    const allowed = new Set(["https://neptune:8182"]);
    expect(() =>
      assertPermittedDbOrigin("https://neptune:8183", allowed),
    ).toThrow(
      new HttpError(
        403,
        `Database origin "https://neptune:8183" is not in the Database Origin Allowlist (PROXY_SERVER_ALLOWED_DB_ORIGINS). Contact your administrator.`,
      ),
    );
  });

  it("treats different schemes as different origins", () => {
    const allowed = new Set(["https://neptune:8182"]);
    expect(() =>
      assertPermittedDbOrigin("http://neptune:8182", allowed),
    ).toThrow(
      new HttpError(
        403,
        `Database origin "http://neptune:8182" is not in the Database Origin Allowlist (PROXY_SERVER_ALLOWED_DB_ORIGINS). Contact your administrator.`,
      ),
    );
  });

  it("rejects all requests when allowlist is an empty set", () => {
    const allowed = new Set<string>();
    expect(() =>
      assertPermittedDbOrigin("https://neptune:8182", allowed),
    ).toThrow(
      new HttpError(
        403,
        `Database origin "https://neptune:8182" is not in the Database Origin Allowlist (PROXY_SERVER_ALLOWED_DB_ORIGINS). Contact your administrator.`,
      ),
    );
  });

  describe("reserved cloud service hosts", () => {
    it.each([
      [
        "IPv4 at the start of the first reserved range",
        "http://169.254.0.0:8182",
      ],
      ["IPv4 inside the first reserved range", "https://169.254.0.200"],
      ["IPv4 low in the first reserved range", "http://169.254.0.23"],
      ["IPv4 single reserved address", "http://169.254.42.42"],
      ["IPv4 reserved shared address space address", "http://100.100.100.200"],
      ["IPv4 end of the second reserved range", "http://169.254.169.255"],
      ["IPv4 written in hex", "http://0xA9FEA9FE:8182"],
      ["IPv4 written as a single number", "http://2852039166:8182"],
      ["IPv6", "http://[fe80::1]:8182"],
      [
        "IPv6 link-local near the end of its range",
        "http://[febf:ffff::1]:8182",
      ],
      ["IPv6 in upper case", "http://[FE80::ABCD]:8182"],
      ["IPv4-mapped IPv6", "http://[::ffff:169.254.169.254]:8182"],
      ["IPv4-compatible IPv6", "http://[::169.254.169.254]:8182"],
      ["IPv4 inside the second reserved range", "http://169.254.169.254"],
      ["IPv4 inside the third reserved range", "http://169.254.170.2"],
      ["IPv6 reserved address", "http://[fd00:ec2::254]"],
      ["IPv6 inside the reserved range, fd00:ec2::23", "http://[fd00:ec2::23]"],
      [
        "IPv6 inside the reserved range, fd00:ec2::253",
        "http://[fd00:ec2::253]",
      ],
      [
        "IPv4 embedded with the NAT64 well-known prefix",
        "http://[64:ff9b::169.254.169.254]",
      ],
      [
        "IPv4 embedded with the NAT64 local-use prefix",
        "http://[64:ff9b:1::a9fe:a9fe]",
      ],
      ["IPv4 embedded with 6to4", "http://[2002:a9fe:a9fe::1]"],
      ["IPv4 embedded as a Teredo server", "http://[2001:0:a9fe:a9fe::1]"],
      [
        "IPv4 embedded as a Teredo client",
        "http://[2001:0:4136:e378:8000:63bf:5601:5601]",
      ],
      ["IPv4-translated IPv6", "http://[::ffff:0:169.254.169.254]"],
    ])("refuses %s with no allowlist", (_, url) => {
      const origin = new URL(url).origin;
      expect(() => assertPermittedDbOrigin(url, undefined)).toThrow(
        new HttpError(
          403,
          `Database origin "${origin}" is a reserved cloud service or IPv6 link-local address, which is not a permitted database host. Edit the connection and change the Database URL to your database's address.`,
        ),
      );
    });

    it("refuses a reserved host even when it is in the allowlist", () => {
      const allowed = new Set(["http://169.254.170.2:8182"]);
      expect(() =>
        assertPermittedDbOrigin("http://169.254.170.2:8182", allowed),
      ).toThrow(
        new HttpError(
          403,
          `Database origin "http://169.254.170.2:8182" is a reserved cloud service or IPv6 link-local address, which is not a permitted database host. Edit the connection and change the Database URL to your database's address.`,
        ),
      );
    });

    it("refuses a reserved IPv6 host even when it is in the allowlist", () => {
      const allowed = new Set(["http://[fd00:ec2::254]"]);
      expect(() =>
        assertPermittedDbOrigin("http://[fd00:ec2::254]", allowed),
      ).toThrow(
        new HttpError(
          403,
          `Database origin "http://[fd00:ec2::254]" is a reserved cloud service or IPv6 link-local address, which is not a permitted database host. Edit the connection and change the Database URL to your database's address.`,
        ),
      );
    });

    it("allows a link-local host outside the reserved ranges when it is in the allowlist", () => {
      const allowed = new Set(["http://169.254.1.2:8182"]);
      expect(() =>
        assertPermittedDbOrigin("http://169.254.1.2:8182", allowed),
      ).not.toThrow();
    });

    it.each([
      ["IPv4 just below link-local", "http://169.253.255.255:8182"],
      ["IPv4 just above link-local", "http://169.255.0.0:8182"],
      [
        "IPv4 link-local, rootless Podman host alias",
        "http://169.254.1.2:8182",
      ],
      ["IPv4 link-local outside the reserved ranges", "https://169.254.10.20"],
      ["IPv4 just before the second reserved range", "http://169.254.168.255"],
      ["IPv4 link-local, VPC Lattice", "http://169.254.171.1:8182"],
      ["IPv4 link-local, container bridge", "http://169.254.172.2:8182"],
      ["IPv4 end of the link-local range", "http://169.254.255.255:8182"],
      [
        "IPv4-mapped IPv6 of a link-local address",
        "http://[::ffff:169.254.1.2]:8182",
      ],
      ["IPv4 loopback", "http://127.0.0.1:8182"],
      ["IPv4 private", "http://10.0.0.5:8182"],
      ["IPv6 just above link-local", "http://[fec0::1]:8182"],
      ["IPv6 loopback", "http://[::1]:8182"],
      ["host name", "https://neptune:8182"],
      ["host name that starts with the range", "https://169.254.example.com"],
      ["IPv6 unique local", "http://[fd12:3456::1]:8182"],
      ["IPv4 private through NAT64", "http://[64:ff9b::a00:5]:8182"],
    ])("allows %s with no allowlist", (_, url) => {
      expect(() => assertPermittedDbOrigin(url, undefined)).not.toThrow();
    });
  });

  it("normalizes default ports (443 for https, 80 for http)", () => {
    const allowedHttps = new Set(["https://neptune"]);
    expect(() =>
      assertPermittedDbOrigin("https://neptune:443/sparql", allowedHttps),
    ).not.toThrow();

    const allowedHttp = new Set(["http://neptune"]);
    expect(() =>
      assertPermittedDbOrigin("http://neptune:80/sparql", allowedHttp),
    ).not.toThrow();
  });
});
