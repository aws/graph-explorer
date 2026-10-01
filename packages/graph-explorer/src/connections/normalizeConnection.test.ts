import { describe, expect, test } from "vitest";

import { isDirectConnection, normalizeConnection } from "./normalizeConnection";

describe("isDirectConnection", () => {
  test("is true when proxyConnection is false", () => {
    expect(
      isDirectConnection({
        graphDbUrl: "https://db:8182",
        proxyConnection: false,
      }),
    ).toBe(true);
  });

  test("is false when proxyConnection is absent", () => {
    expect(isDirectConnection({ graphDbUrl: "https://db:8182" })).toBe(false);
  });

  test("is false when there is no connection", () => {
    expect(isDirectConnection(undefined)).toBe(false);
  });
});

describe("normalizeConnection", () => {
  test("should remove trailing slash from graphDbUrl", () => {
    const result = normalizeConnection({ graphDbUrl: "https://example.com/" });
    expect(result.graphDbUrl).toBe("https://example.com");
  });

  test("should default queryEngine to gremlin", () => {
    const result = normalizeConnection({ graphDbUrl: "https://example.com" });
    expect(result.queryEngine).toBe("gremlin");
  });

  test("should default awsAuthEnabled to false", () => {
    const result = normalizeConnection({ graphDbUrl: "https://example.com" });
    expect(result.awsAuthEnabled).toBe(false);
  });

  test("should preserve path in graphDbUrl", () => {
    const result = normalizeConnection({
      graphDbUrl: "http://blazegraph:9999/blazegraph/namespace/kb",
    });
    expect(result.graphDbUrl).toBe(
      "http://blazegraph:9999/blazegraph/namespace/kb",
    );
  });

  test("should remove only trailing slash from graphDbUrl with path", () => {
    const result = normalizeConnection({
      graphDbUrl: "http://blazegraph:9999/blazegraph/namespace/kb/",
    });
    expect(result.graphDbUrl).toBe(
      "http://blazegraph:9999/blazegraph/namespace/kb",
    );
  });

  test("should preserve proxyConnection false on a direct connection", () => {
    const result = normalizeConnection({
      graphDbUrl: "https://example.com",
      proxyConnection: false,
    });
    expect(result.proxyConnection).toBe(false);
  });

  test("should strip newlines and surrounding whitespace from graphDbUrl", () => {
    const result = normalizeConnection({
      graphDbUrl: "  https://db.com/\r\ngraph  ",
    });
    expect(result.graphDbUrl).toBe("https://db.com/graph");
  });
});
