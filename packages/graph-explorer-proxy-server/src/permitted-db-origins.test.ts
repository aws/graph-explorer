import { describe, expect, it } from "vitest";

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

  describe("link-local hosts", () => {
    it.each([
      ["IPv4 at the start of the range", "http://169.254.0.0:8182"],
      ["IPv4 inside the range", "https://169.254.10.20"],
      ["IPv4 at the end of the range", "http://169.254.255.255:8182"],
      ["IPv4 written in hex", "http://0xA9FE0A14:8182"],
      ["IPv4 written as a single number", "http://2851998228:8182"],
      ["IPv6", "http://[fe80::1]:8182"],
      ["IPv6 at the end of the range", "http://[febf:ffff::1]:8182"],
      ["IPv6 in upper case", "http://[FE80::ABCD]:8182"],
      ["IPv4-mapped IPv6", "http://[::ffff:169.254.10.20]:8182"],
      ["IPv4-compatible IPv6", "http://[::169.254.10.20]:8182"],
    ])("refuses %s with no allowlist", (_, url) => {
      const origin = new URL(url).origin;
      expect(() => assertPermittedDbOrigin(url, undefined)).toThrow(
        new HttpError(
          403,
          `Database origin "${origin}" is a link-local address, which is not a permitted database host. Edit the connection and change the Database URL to your database's address.`,
        ),
      );
    });

    it("refuses a link-local host even when it is in the allowlist", () => {
      const allowed = new Set(["http://169.254.1.1:8182"]);
      expect(() =>
        assertPermittedDbOrigin("http://169.254.1.1:8182", allowed),
      ).toThrow(
        new HttpError(
          403,
          `Database origin "http://169.254.1.1:8182" is a link-local address, which is not a permitted database host. Edit the connection and change the Database URL to your database's address.`,
        ),
      );
    });

    it.each([
      ["IPv4 just below the range", "http://169.253.255.255:8182"],
      ["IPv4 just above the range", "http://169.255.0.0:8182"],
      ["IPv4 loopback", "http://127.0.0.1:8182"],
      ["IPv4 private", "http://10.0.0.5:8182"],
      ["IPv6 just above the range", "http://[fec0::1]:8182"],
      ["IPv6 loopback", "http://[::1]:8182"],
      ["host name", "https://neptune:8182"],
      ["host name that starts with the range", "https://169.254.example.com"],
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
