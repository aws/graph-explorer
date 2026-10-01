// @vitest-environment happy-dom

import { describe, expect, onTestFinished, test } from "vite-plus/test";

import { env, ReverseProxyMisconfiguredError } from "@/utils";
import { stubDocumentUrl } from "@/utils/testing";

import { apiUrl } from "./apiUrl";

describe("apiUrl", () => {
  test("resolves a simple endpoint under the static mount, with a trailing slash", () => {
    stubDocumentUrl("http://localhost/explorer/");

    const result = apiUrl("gremlin");

    expect(result.href).toBe("http://localhost/gremlin");
  });

  test("resolves a bare static mount path with no trailing slash", () => {
    stubDocumentUrl("http://localhost/explorer");

    const result = apiUrl("gremlin");

    expect(result.href).toBe("http://localhost/gremlin");
  });

  test("resolves under a reverse-proxy prefix, with a trailing slash", () => {
    stubDocumentUrl("http://localhost/proxy/9250/explorer/");

    const result = apiUrl("gremlin");

    expect(result.href).toBe("http://localhost/proxy/9250/gremlin");
  });

  test("resolves a bare static mount path with no trailing slash under a reverse-proxy prefix", () => {
    stubDocumentUrl("http://localhost/proxy/9250/explorer");

    const result = apiUrl("gremlin");

    expect(result.href).toBe("http://localhost/proxy/9250/gremlin");
  });

  test("resolves when the document path names a file under the static mount", () => {
    stubDocumentUrl("http://localhost/explorer/index.html");

    const result = apiUrl("gremlin");

    expect(result.href).toBe("http://localhost/gremlin");
  });

  test("resolves from the last occurrence when the mount segment repeats in the path", () => {
    stubDocumentUrl("http://localhost/explorer/explorer/");

    const result = apiUrl("gremlin");

    expect(result.href).toBe("http://localhost/explorer/gremlin");
  });

  test("resolves when the mount segment is a path segment inside a longer segment name", () => {
    stubDocumentUrl("http://localhost/explorer-team/explorer/");

    const result = apiUrl("gremlin");

    expect(result.href).toBe("http://localhost/explorer-team/gremlin");
  });

  test("throws when the path segment merely starts with the mount name", () => {
    stubDocumentUrl("http://localhost/explorer-ui/");

    expect(() => apiUrl("gremlin")).toThrow(
      new ReverseProxyMisconfiguredError("/explorer-ui/"),
    );
  });

  test("throws when the mount name appears only as part of a longer segment", () => {
    stubDocumentUrl("http://localhost/proxy/explorer2/");

    expect(() => apiUrl("gremlin")).toThrow(
      new ReverseProxyMisconfiguredError("/proxy/explorer2/"),
    );
  });

  test("resolves against the document root when the static mount segment is absent, as in dev mode", () => {
    stubDocumentUrl("http://localhost/");

    const result = apiUrl("gremlin");

    expect(result.href).toBe("http://localhost/gremlin");
  });

  // The Proxy Server serves nothing at "/", so a production page there means a
  // reverse proxy mapped the site root onto the static mount.
  test("throws at the document root in a production build", () => {
    const { DEV } = env;
    env.DEV = false;
    onTestFinished(() => {
      env.DEV = DEV;
    });
    stubDocumentUrl("http://localhost/");

    expect(() => apiUrl("gremlin")).toThrow(
      new ReverseProxyMisconfiguredError("/"),
    );
  });

  // A reverse proxy that renames the mount segment away (e.g. mapping an
  // external /gx/ onto the server's /explorer/) leaves a path with segments
  // but none of them the static mount. Falling back to "/" here would send
  // every database request, connection URL and query text included, to the
  // wrong place, so this must fail loudly instead.
  test("throws when the document path has segments but none of them is the static mount", () => {
    stubDocumentUrl("http://localhost/gx/");

    expect(() => apiUrl("gremlin")).toThrow(
      new ReverseProxyMisconfiguredError("/gx/"),
    );
  });

  test("throws when the document path would resolve the API root to another origin", () => {
    stubDocumentUrl("http://localhost//evil.com/explorer/");

    expect(() => apiUrl("gremlin")).toThrow(
      new ReverseProxyMisconfiguredError("//evil.com/explorer/"),
    );
  });

  test("preserves the query string on the endpoint", () => {
    stubDocumentUrl("http://localhost/explorer/");

    const result = apiUrl("pg/statistics/summary?mode=detailed");

    expect(result.href).toBe(
      "http://localhost/pg/statistics/summary?mode=detailed",
    );
  });
});
