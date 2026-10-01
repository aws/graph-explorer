import type { LegacyConnectionConfig } from "@shared/types";

import { describe, expect, test } from "vitest";

import type { ConfigurationId, RawConfiguration } from "@/connections";

import {
  createRandomRawConfiguration,
  preloadStoredConfiguration,
} from "@/utils/testing";

import {
  transformConfiguration,
  transformLegacyConnection,
} from "./legacyConnection";

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * Connections persisted before the unified-proxy model carried a
 * `url`/`proxyConnection` pair instead of the canonical `graphDbUrl`.
 * `transformLegacyConnection` folds every combination of that legacy shape
 * (both fields, either alone, `proxyConnection` true/false/absent) into
 * `graphDbUrl` and drops `url`. A direct connection keeps
 * `proxyConnection: false`, which is also the canonical shape of a deprecated
 * direct connection, and loses its AWS auth settings. A proxy connection
 * omits the flag.
 *
 * DO NOT delete or weaken these tests without confirming no stored connection
 * can still carry the legacy `url`/`proxyConnection` shape.
 */
describe("backward compatibility: legacy url/proxyConnection connection shape", () => {
  test("should use graphDbUrl directly when proxyConnection is true", () => {
    const result = transformLegacyConnection({
      url: "https://proxy.example.com",
      proxyConnection: true,
      graphDbUrl: "https://my-neptune:8182",
    });
    expect(result).toStrictEqual({ graphDbUrl: "https://my-neptune:8182" });
  });

  test("should use url as graphDbUrl and keep the direct flag when proxyConnection is false", () => {
    const result = transformLegacyConnection({
      url: "https://my-neptune:8182",
      proxyConnection: false,
    });
    expect(result).toStrictEqual({
      graphDbUrl: "https://my-neptune:8182",
      proxyConnection: false,
    });
  });

  // Versions before the unified-proxy model saved the form's hidden
  // `graphDbUrl` on direct connections too, so it can be stale there while
  // `url` is the database the user actually queried.
  test("should prefer url over graphDbUrl on a direct connection", () => {
    const result = transformLegacyConnection({
      url: "https://my-neptune:8182",
      graphDbUrl: "https://stale.example.com",
      proxyConnection: false,
    });
    expect(result).toStrictEqual({
      graphDbUrl: "https://my-neptune:8182",
      proxyConnection: false,
    });
  });

  test("should infer a proxy connection and use graphDbUrl when proxyConnection is absent but graphDbUrl is present", () => {
    const result = transformLegacyConnection({
      graphDbUrl: "https://db.com",
      queryEngine: "gremlin",
    });
    expect(result.graphDbUrl).toBe("https://db.com");
    expect(result).not.toHaveProperty("proxyConnection");
  });

  // graphDbUrl is present (even empty), so proxyConnection is still inferred
  // per the rule above, and the url is discarded rather than used as a
  // fallback. Pinning today's behavior, not endorsing it.
  test("should infer a proxy connection and discard the url when graphDbUrl is present but empty and proxyConnection is absent", () => {
    const result = transformLegacyConnection({
      url: "https://x",
      graphDbUrl: "",
    });
    expect(result).toStrictEqual({ graphDbUrl: "" });
  });

  test("should keep graphDbUrl over the proxy url when proxyConnection is absent and both are set", () => {
    const result = transformLegacyConnection({
      url: "https://proxy.example.com",
      graphDbUrl: "https://db.com",
      queryEngine: "gremlin",
    });
    expect(result).toStrictEqual({
      graphDbUrl: "https://db.com",
      queryEngine: "gremlin",
    });
  });

  test("should treat a connection with only url as direct", () => {
    const result = transformLegacyConnection({
      url: "https://my-neptune:8182",
    });
    expect(result).toStrictEqual({
      graphDbUrl: "https://my-neptune:8182",
      proxyConnection: false,
    });
  });

  test("should keep a relative url unchanged for a direct connection", () => {
    const result = transformLegacyConnection({
      url: "/neptune",
      proxyConnection: false,
    });
    expect(result).toStrictEqual({
      graphDbUrl: "/neptune",
      proxyConnection: false,
    });
  });

  test("should fall back to graphDbUrl for a direct connection when url is empty", () => {
    const result = transformLegacyConnection({
      url: "",
      proxyConnection: false,
      graphDbUrl: "https://db",
    });
    expect(result).toStrictEqual({
      graphDbUrl: "https://db",
      proxyConnection: false,
    });
  });

  // Out of scope: a `proxyConnection: true` connection with only `url` set
  // (no `graphDbUrl`) yields an empty `graphDbUrl`, matching base behavior.
  test("should yield an empty graphDbUrl when proxyConnection is true and only url is set", () => {
    const result = transformLegacyConnection({
      url: "https://proxy.example.com",
      proxyConnection: true,
    });
    expect(result).toStrictEqual({ graphDbUrl: "" });
  });

  test("should omit proxyConnection from a proxy connection", () => {
    const result = transformLegacyConnection({
      url: "https://proxy.com",
      proxyConnection: true,
      graphDbUrl: "https://db.com",
    });
    expect(result).not.toHaveProperty("proxyConnection");
  });

  test("should not include url in result", () => {
    const result = transformLegacyConnection({
      url: "https://my-neptune:8182",
      proxyConnection: false,
    });
    expect(result).not.toHaveProperty("url");
  });

  test("should preserve other connection properties", () => {
    const result = transformLegacyConnection({
      url: "https://proxy.com",
      proxyConnection: true,
      graphDbUrl: "https://db.com",
      queryEngine: "sparql",
      awsAuthEnabled: true,
      awsRegion: "us-east-1",
      serviceType: "neptune-graph",
      fetchTimeoutMs: 30000,
      nodeExpansionLimit: 100,
    });
    expect(result).toStrictEqual({
      graphDbUrl: "https://db.com",
      queryEngine: "sparql",
      awsAuthEnabled: true,
      awsRegion: "us-east-1",
      serviceType: "neptune-graph",
      fetchTimeoutMs: 30000,
      nodeExpansionLimit: 100,
    });
  });

  test("should pass through a connection that already has graphDbUrl and no url unchanged", () => {
    const result = transformLegacyConnection({
      graphDbUrl: "https://db.com",
      queryEngine: "gremlin",
    });
    expect(result).toStrictEqual({
      graphDbUrl: "https://db.com",
      queryEngine: "gremlin",
    });
  });

  test("should pass through a canonical direct connection unchanged", () => {
    const result = transformLegacyConnection({
      graphDbUrl: "https://my-neptune:8182",
      proxyConnection: false,
      queryEngine: "sparql",
    });
    expect(result).toStrictEqual({
      graphDbUrl: "https://my-neptune:8182",
      proxyConnection: false,
      queryEngine: "sparql",
    });
  });

  test.each([
    {
      url: "https://proxy.com",
      proxyConnection: true,
      graphDbUrl: "https://db.com",
    },
    { url: "https://my-neptune:8182", proxyConnection: false },
    { url: "https://my-neptune:8182" },
    { graphDbUrl: "https://db.com" },
    { graphDbUrl: "https://my-neptune:8182", proxyConnection: false },
    { proxyConnection: false },
  ])("should be idempotent for %o", connection => {
    const once = transformLegacyConnection(connection);
    expect(transformLegacyConnection(once)).toStrictEqual(once);
  });

  test("should fall back to empty string when no url is present", () => {
    const result = transformLegacyConnection({
      proxyConnection: false,
      queryEngine: "gremlin",
    });
    expect(result).toStrictEqual({
      graphDbUrl: "",
      proxyConnection: false,
      queryEngine: "gremlin",
    });
  });

  test("should clear AWS auth settings on a legacy direct connection", () => {
    const result = transformLegacyConnection({
      url: "https://my-neptune:8182",
      proxyConnection: false,
      awsAuthEnabled: true,
      awsRegion: "us-east-1",
      serviceType: "neptune-db",
    });
    expect(result).toStrictEqual({
      graphDbUrl: "https://my-neptune:8182",
      proxyConnection: false,
    });
  });

  test("should clear AWS auth settings on a canonical direct connection", () => {
    const result = transformLegacyConnection({
      graphDbUrl: "https://my-neptune:8182",
      proxyConnection: false,
      awsAuthEnabled: true,
      awsRegion: "us-east-1",
      serviceType: "neptune-db",
    });
    expect(result).toStrictEqual({
      graphDbUrl: "https://my-neptune:8182",
      proxyConnection: false,
    });
  });

  test("should keep AWS auth settings on a legacy proxy connection", () => {
    const result = transformLegacyConnection({
      url: "https://proxy.example.com",
      graphDbUrl: "https://db.com",
      proxyConnection: true,
      awsAuthEnabled: true,
      awsRegion: "us-east-1",
      serviceType: "neptune-db",
    });
    expect(result.awsAuthEnabled).toBe(true);
    expect(result.awsRegion).toBe("us-east-1");
    expect(result.serviceType).toBe("neptune-db");
  });

  test("should keep AWS auth settings when proxyConnection is absent but graphDbUrl infers a proxy connection", () => {
    const result = transformLegacyConnection({
      graphDbUrl: "https://db.com",
      awsAuthEnabled: true,
      awsRegion: "us-east-1",
      serviceType: "neptune-db",
    });
    expect(result.awsAuthEnabled).toBe(true);
    expect(result.awsRegion).toBe("us-east-1");
    expect(result.serviceType).toBe("neptune-db");
  });
});

function configWithLegacyConnection(
  connection: LegacyConnectionConfig,
): RawConfiguration {
  return {
    ...createRandomRawConfiguration(),
    // Stored data is not schema-validated on read, so an entry can carry a
    // legacy connection despite the compile-time `ConnectionConfig` shape.
    connection: connection as RawConfiguration["connection"],
  };
}

function configMap(
  ...configs: RawConfiguration[]
): Map<ConfigurationId, RawConfiguration> {
  return new Map(configs.map(config => [config.id, config]));
}

describe("transformConfiguration", () => {
  test("uses graphDbUrl when proxyConnection is true", () => {
    const config = configWithLegacyConnection({
      url: "https://proxy.example.com",
      proxyConnection: true,
      graphDbUrl: "https://my-neptune:8182",
    });

    const result = transformConfiguration(configMap(config));

    expect(result.get(config.id)?.connection?.graphDbUrl).toBe(
      "https://my-neptune:8182",
    );
  });

  test("uses url and keeps the direct flag when proxyConnection is false", () => {
    const config = configWithLegacyConnection({
      url: "https://my-neptune:8182",
      proxyConnection: false,
    });

    const result = transformConfiguration(configMap(config));

    expect(result.get(config.id)?.connection).toStrictEqual({
      graphDbUrl: "https://my-neptune:8182",
      proxyConnection: false,
    });
  });

  test("passes a canonical direct connection through unchanged", () => {
    const config: RawConfiguration = {
      ...createRandomRawConfiguration(),
      connection: {
        graphDbUrl: "https://my-neptune:8182",
        proxyConnection: false,
        queryEngine: "gremlin",
      },
    };

    const result = transformConfiguration(configMap(config));

    expect(result.get(config.id)).toStrictEqual(config);
  });

  test("infers a proxy connection and uses graphDbUrl when proxyConnection is absent but graphDbUrl is present", () => {
    const config = configWithLegacyConnection({
      graphDbUrl: "https://my-neptune:8182",
    });

    const result = transformConfiguration(configMap(config));

    expect(result.get(config.id)?.connection?.graphDbUrl).toBe(
      "https://my-neptune:8182",
    );
  });

  test("treats a connection with only url as direct", () => {
    const config = configWithLegacyConnection({
      url: "https://my-neptune:8182",
    });

    const result = transformConfiguration(configMap(config));

    expect(result.get(config.id)?.connection).toStrictEqual({
      graphDbUrl: "https://my-neptune:8182",
      proxyConnection: false,
    });
  });

  test("passes an already-migrated connection through unchanged", () => {
    const config = createRandomRawConfiguration();

    const result = transformConfiguration(configMap(config));

    expect(result.get(config.id)).toStrictEqual(config);
  });

  test("handles an empty map", () => {
    const result = transformConfiguration(new Map());

    expect(result.size).toBe(0);
  });

  test("passes an entry with no connection through unchanged", () => {
    const config: RawConfiguration = {
      ...createRandomRawConfiguration(),
      connection: undefined,
    };

    const result = transformConfiguration(configMap(config));

    expect(result.get(config.id)).toStrictEqual(config);
  });
});

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * `configurationAtom` stores connections that, prior to the unified-proxy
 * model, carried a `url`/`proxyConnection` pair instead of `graphDbUrl`. That
 * legacy shape is folded into the canonical shape at read time via this
 * ReadTransform, so every consumer of the atom — not only the active
 * connection, which separately normalizes on its own — sees a migrated
 * `graphDbUrl`, with `proxyConnection: false` kept on a direct connection.
 *
 * DO NOT delete or weaken this test without confirming no stored connection
 * can still carry the legacy `url`/`proxyConnection` shape.
 */
describe("backward compatibility: legacy connection shape in storage", () => {
  test("migrates a direct connection saved by an earlier version's form when the real configuration atom preloads", async () => {
    // An earlier version's form always saved the flag and the IAM fields,
    // even for a direct connection.
    const config = configWithLegacyConnection({
      url: "https://my-neptune:8182",
      proxyConnection: false,
      graphDbUrl: "",
      awsAuthEnabled: false,
      awsRegion: "",
      serviceType: "neptune-db",
      queryEngine: "gremlin",
      fetchTimeoutMs: 30000,
      nodeExpansionLimit: 25,
    });

    const stored = await preloadStoredConfiguration(config);

    expect(stored?.connection).toStrictEqual({
      graphDbUrl: "https://my-neptune:8182",
      proxyConnection: false,
      queryEngine: "gremlin",
      fetchTimeoutMs: 30000,
      nodeExpansionLimit: 25,
    });
  });
});
