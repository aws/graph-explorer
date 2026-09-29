import type { LegacyConnectionConfig } from "@shared/types";

import { describe, expect, test } from "vitest";

import {
  createRandomRawConfiguration,
  preloadStoredConfiguration,
} from "@/utils/testing";

import type {
  ConfigurationId,
  RawConfiguration,
} from "../ConfigurationProvider";

import { transformConfiguration } from "./configurationTransform";

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
