import { assertAllowedDbOrigin } from "./allowed-db-origins.ts";
import { HttpError } from "./errors.ts";

describe("assertAllowedDbOrigin", () => {
  it("does nothing when allowlist is undefined (permissive)", () => {
    expect(() =>
      assertAllowedDbOrigin("https://neptune:8182", undefined),
    ).not.toThrow();
  });

  it("does nothing when the origin is in the allowlist", () => {
    const allowed = new Set(["https://neptune:8182"]);
    expect(() =>
      assertAllowedDbOrigin("https://neptune:8182/sparql", allowed),
    ).not.toThrow();
  });

  it("throws HttpError 403 when the origin is not in the allowlist", () => {
    const allowed = new Set(["https://neptune:8182"]);
    expect(() => assertAllowedDbOrigin("https://evil:9999", allowed)).toThrow(
      expect.objectContaining({
        status: 403,
        message: expect.stringContaining("https://evil:9999"),
      }),
    );
    expect(() => assertAllowedDbOrigin("https://evil:9999", allowed)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining("administrator"),
      }),
    );
  });

  it("is case insensitive (URL constructor normalizes)", () => {
    const allowed = new Set(["https://neptune:8182"]);
    expect(() =>
      assertAllowedDbOrigin("HTTPS://NEPTUNE:8182/gremlin", allowed),
    ).not.toThrow();
  });

  it("ignores trailing slashes (origin strips path)", () => {
    const allowed = new Set(["https://neptune:8182"]);
    expect(() =>
      assertAllowedDbOrigin("https://neptune:8182/", allowed),
    ).not.toThrow();
  });

  it("treats different ports as different origins", () => {
    const allowed = new Set(["https://neptune:8182"]);
    expect(() =>
      assertAllowedDbOrigin("https://neptune:8183", allowed),
    ).toThrow(HttpError);
  });

  it("treats different schemes as different origins", () => {
    const allowed = new Set(["https://neptune:8182"]);
    expect(() => assertAllowedDbOrigin("http://neptune:8182", allowed)).toThrow(
      HttpError,
    );
  });

  it("rejects all requests when allowlist is an empty set", () => {
    const allowed = new Set<string>();
    expect(() =>
      assertAllowedDbOrigin("https://neptune:8182", allowed),
    ).toThrow(HttpError);
  });

  it("normalizes default ports (443 for https, 80 for http)", () => {
    const allowedHttps = new Set(["https://neptune"]);
    expect(() =>
      assertAllowedDbOrigin("https://neptune:443/sparql", allowedHttps),
    ).not.toThrow();

    const allowedHttp = new Set(["http://neptune"]);
    expect(() =>
      assertAllowedDbOrigin("http://neptune:80/sparql", allowedHttp),
    ).not.toThrow();
  });
});
