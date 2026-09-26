import type { LegacyConnectionConfig } from "@shared/types";

import { createStore } from "jotai";
import localforage from "localforage";

import { createRandomRawConfiguration } from "@/utils/testing";

import type {
  ConfigurationId,
  RawConfiguration,
} from "../ConfigurationProvider";

import { atomWithLocalForage, reconcileMapByKey } from "./atomWithLocalForage";
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

  test("uses url when proxyConnection is false", () => {
    const config = configWithLegacyConnection({
      url: "https://my-neptune:8182",
      proxyConnection: false,
    });

    const result = transformConfiguration(configMap(config));

    expect(result.get(config.id)?.connection?.graphDbUrl).toBe(
      "https://my-neptune:8182",
    );
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

  test("uses url when both proxyConnection and graphDbUrl are absent", () => {
    const config = configWithLegacyConnection({
      url: "https://my-neptune:8182",
    });

    const result = transformConfiguration(configMap(config));

    expect(result.get(config.id)?.connection?.graphDbUrl).toBe(
      "https://my-neptune:8182",
    );
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
 * `graphDbUrl`.
 *
 * DO NOT delete or weaken this test without confirming no stored connection
 * can still carry the legacy `url`/`proxyConnection` shape.
 */
describe("backward compatibility: legacy connection shape in storage", () => {
  beforeEach(async () => {
    await localforage.clear();
  });

  test("migrates a stored legacy connection through the full atomWithLocalForage pipeline", async () => {
    const key = "test-configuration-legacy-compat";
    const config = configWithLegacyConnection({
      url: "https://my-neptune:8182",
      proxyConnection: false,
    });

    await localforage.setItem(key, configMap(config));

    const atom = await atomWithLocalForage<
      Map<ConfigurationId, RawConfiguration>
    >(key, new Map(), {
      reconcile: reconcileMapByKey,
      transform: transformConfiguration,
    });

    const store = createStore();
    const value = store.get(atom);

    expect(value.get(config.id)?.connection?.graphDbUrl).toBe(
      "https://my-neptune:8182",
    );
  });
});
