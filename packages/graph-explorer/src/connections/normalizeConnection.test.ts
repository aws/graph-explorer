import type { ConnectionConfig } from "@shared/types";

import { describe, expect, test } from "vite-plus/test";

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

  /**
   * BACKWARD COMPATIBILITY — PERSISTED DATA
   *
   * `nodeExpansionLimit` and `fetchTimeoutMs` are read from stored
   * connections, which can hold values outside their declared type. An older
   * version may have written either as a digit string, which still reads as
   * that number. A fraction is not a positive integer, so it reads as absent,
   * as does any other unusable value.
   *
   * DO NOT delete or weaken these tests without confirming no stored
   * connection can still carry these shapes.
   */
  describe("backward compatibility: stored numeric overrides", () => {
    // Stored connections can hold values outside their declared type. The casts simulate one.
    function connectionWithOverrides(value: unknown) {
      return {
        graphDbUrl: "https://example.com",
        fetchTimeoutMs: value,
        nodeExpansionLimit: value,
      } as unknown as ConnectionConfig;
    }

    test.each([
      ["a number", 50],
      ["a digit string", "50"],
    ])("should keep an override stored as %s", (_label, value) => {
      const result = normalizeConnection(connectionWithOverrides(value));

      expect(result.fetchTimeoutMs).toBe(50);
      expect(result.nodeExpansionLimit).toBe(50);
    });

    test.each([
      ["a non-numeric string", "abc"],
      ["zero", 0],
      ["a negative number", -5],
      ["a fraction", 1.5],
      ["null", null],
      ["a boolean", true],
    ])("should drop an override stored as %s", (_label, value) => {
      const result = normalizeConnection(connectionWithOverrides(value));

      expect(result).not.toHaveProperty("fetchTimeoutMs");
      expect(result).not.toHaveProperty("nodeExpansionLimit");
    });

    test("should leave an absent override absent", () => {
      expect(
        normalizeConnection({ graphDbUrl: "https://example.com" }),
      ).toStrictEqual({
        graphDbUrl: "https://example.com",
        queryEngine: "gremlin",
        awsAuthEnabled: false,
      });
    });
  });
});
