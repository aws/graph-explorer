import type { LegacyConnectionConfig } from "@shared/types";

import { createStore } from "jotai";
import localforage from "localforage";

import { createRandomRawConfiguration } from "@/utils/testing";

import type { RawConfiguration } from "../ConfigurationProvider";

import { defaultGraphViewLayout } from "./graphViewLayoutDefaults";
import { defaultSchemaViewLayout } from "./schemaViewLayoutDefaults";
import {
  activeConfigurationAtom,
  allGraphSessionsAtom,
  allowLoggingDbQueryAtom,
  configurationAtom,
  defaultNeighborExpansionLimitAtom,
  defaultNeighborExpansionLimitEnabledAtom,
  diagnosticLoggingAtom,
  userEdgeStylesAtom,
  schemaAtom,
  schemaViewLayoutAtom,
  showDebugActionsAtom,
  graphViewLayoutAtom,
  userVertexStylesAtom,
} from "./storageAtoms";

/**
 * storageAtoms.ts uses top-level await to preload IndexedDB data into Jotai
 * atoms. These tests verify that all atoms are properly initialized and
 * readable from a fresh store, which guards against circular dependency
 * regressions that would leave atoms as `undefined`.
 */
describe("storageAtoms", () => {
  it("should initialize all atoms as defined values", () => {
    expect(activeConfigurationAtom).toBeDefined();
    expect(configurationAtom).toBeDefined();
    expect(schemaAtom).toBeDefined();
    expect(userVertexStylesAtom).toBeDefined();
    expect(userEdgeStylesAtom).toBeDefined();
    expect(graphViewLayoutAtom).toBeDefined();
    expect(schemaViewLayoutAtom).toBeDefined();
    expect(allGraphSessionsAtom).toBeDefined();
    expect(showDebugActionsAtom).toBeDefined();
    expect(allowLoggingDbQueryAtom).toBeDefined();
    expect(defaultNeighborExpansionLimitEnabledAtom).toBeDefined();
    expect(defaultNeighborExpansionLimitAtom).toBeDefined();
    expect(diagnosticLoggingAtom).toBeDefined();
  });

  it("should provide correct default values from a fresh store", () => {
    const store = createStore();

    expect(store.get(activeConfigurationAtom)).toBeNull();
    expect(store.get(configurationAtom)).toStrictEqual(new Map());
    expect(store.get(schemaAtom)).toStrictEqual(new Map());
    expect(store.get(userVertexStylesAtom)).toStrictEqual(new Map());
    expect(store.get(userEdgeStylesAtom)).toStrictEqual(new Map());
    expect(store.get(graphViewLayoutAtom)).toStrictEqual(
      defaultGraphViewLayout,
    );
    expect(store.get(schemaViewLayoutAtom)).toStrictEqual(
      defaultSchemaViewLayout,
    );
    expect(store.get(allGraphSessionsAtom)).toStrictEqual(new Map());
    expect(store.get(showDebugActionsAtom)).toBe(false);
    expect(store.get(allowLoggingDbQueryAtom)).toBe(false);
    expect(store.get(defaultNeighborExpansionLimitEnabledAtom)).toBe(true);
    expect(store.get(defaultNeighborExpansionLimitAtom)).toBe(10);
    expect(store.get(diagnosticLoggingAtom)).toBe(false);
  });

  it("should persist a written value on subsequent reads", () => {
    const store = createStore();

    store.set(showDebugActionsAtom, true);
    expect(store.get(showDebugActionsAtom)).toBe(true);

    store.set(showDebugActionsAtom, false);
    expect(store.get(showDebugActionsAtom)).toBe(false);
  });
});

/**
 * BACKWARD COMPATIBILITY — CONNECTIONS STORED BY EARLIER VERSIONS
 *
 * Earlier versions stored a connection with a `url`/`proxyConnection` pair.
 * The real `configurationAtom` must fold that shape into the canonical one
 * as it preloads, so these tests seed IndexedDB and then load a fresh copy
 * of storageAtoms.ts. Removing `transform: transformConfiguration` from its
 * `configuration` atom must fail them.
 *
 * DO NOT delete or weaken these tests without confirming no stored
 * connection can still carry the legacy shape.
 */
describe("backward compatibility: connections stored by earlier versions", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  function storedConfig(connection: LegacyConnectionConfig): RawConfiguration {
    return {
      ...createRandomRawConfiguration(),
      // Stored data is not schema-validated on read.
      connection: connection as RawConfiguration["connection"],
    };
  }

  function storeConfigs(...configs: RawConfiguration[]) {
    return localforage.setItem(
      "configuration",
      new Map(configs.map(config => [config.id, config])),
    );
  }

  /** A fresh copy of storageAtoms.ts, preloading what is stored now. */
  async function preloadAtoms() {
    const [atoms, persistence] = await Promise.all([
      import("./storageAtoms"),
      import("./persistence"),
    ]);
    return { ...atoms, ...persistence, store: createStore() };
  }

  it("transforms a stored proxied IAM connection when the atoms preload", async () => {
    const config = storedConfig({
      url: "https://proxy.example.com",
      proxyConnection: true,
      graphDbUrl: "https://neptune:8182",
      awsAuthEnabled: true,
      awsRegion: "us-east-1",
      serviceType: "neptune-db",
      queryEngine: "gremlin",
      fetchTimeoutMs: 30000,
      nodeExpansionLimit: 25,
    });
    await storeConfigs(config);

    const { store, configurationAtom } = await preloadAtoms();

    expect(
      store.get(configurationAtom).get(config.id)?.connection,
    ).toStrictEqual({
      graphDbUrl: "https://neptune:8182",
      awsAuthEnabled: true,
      awsRegion: "us-east-1",
      serviceType: "neptune-db",
      queryEngine: "gremlin",
      fetchTimeoutMs: 30000,
      nodeExpansionLimit: 25,
    });
  });

  // A tab still running an earlier version keeps writing the legacy shape.
  // This tab's write upserts only the entry it changed, so the other entries
  // stay as stored and are transformed again on the next load.
  it("leaves stored legacy entries as they are when this tab adds a connection", async () => {
    const storedByThisTab = storedConfig({
      url: "https://proxy.example.com",
      proxyConnection: true,
      graphDbUrl: "https://neptune-a:8182",
    });
    await storeConfigs(storedByThisTab);
    const { store, configurationAtom, persistenceStatusStore } =
      await preloadAtoms();

    const storedByOtherTab = storedConfig({
      url: "https://proxy.example.com",
      proxyConnection: true,
      graphDbUrl: "https://neptune-b:8182",
    });
    await storeConfigs(storedByThisTab, storedByOtherTab);
    const added = createRandomRawConfiguration();
    store.set(configurationAtom, prev => new Map(prev).set(added.id, added));
    await persistenceStatusStore.waitForIdle();

    expect(await localforage.getItem("configuration")).toStrictEqual(
      new Map([
        [storedByThisTab.id, storedByThisTab],
        [storedByOtherTab.id, storedByOtherTab],
        [added.id, added],
      ]),
    );
  });
});
