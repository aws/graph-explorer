import type { LegacyConnectionConfig } from "@shared/types";

import { createStore } from "jotai";
import localforage from "localforage";
import { describe, expect, it, vi } from "vite-plus/test";

import type { SavedConnection } from "@/connections";

import { createEdgeType } from "@/core/entities";
import {
  createRandomSavedConnection,
  preloadSavedConnections,
} from "@/utils/testing";

import type { EdgeStyleStorage, LegacyUserStylingStorage } from "./graphStyles";

import { defaultGraphViewLayout } from "./graphViewLayoutDefaults";
import { PersistedStateLoadError } from "./PersistedStateLoadError";
import { defaultSchemaViewLayout } from "./schemaViewLayoutDefaults";
import {
  activeConnectionIdAtom,
  allGraphSessionsAtom,
  allowLoggingDbQueryAtom,
  savedConnectionsAtom,
  defaultNeighborExpansionLimitAtom,
  defaultNeighborExpansionLimitEnabledAtom,
  diagnosticLoggingAtom,
  userEdgeStylesAtom,
  schemaAtom,
  schemaViewLayoutAtom,
  showDebugActionsAtom,
  graphViewLayoutAtom,
  loadPersistedState,
  userVertexStylesAtom,
} from "./storageAtoms";

/**
 * storageAtoms.ts defines every persisted atom. These tests verify that all
 * atoms are defined and readable from a fresh store once seeded, which guards
 * against circular dependency regressions that would leave atoms as
 * `undefined`.
 */
describe("storageAtoms", () => {
  it("should initialize all atoms as defined values", () => {
    expect(activeConnectionIdAtom).toBeDefined();
    expect(savedConnectionsAtom).toBeDefined();
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

    expect(store.get(activeConnectionIdAtom)).toBeNull();
    expect(store.get(savedConnectionsAtom)).toStrictEqual(new Map());
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

  it("tags each atom with the key it is stored under", () => {
    expect({
      activeConnectionIdAtom: activeConnectionIdAtom.storageKey,
      savedConnectionsAtom: savedConnectionsAtom.storageKey,
      schemaAtom: schemaAtom.storageKey,
      userVertexStylesAtom: userVertexStylesAtom.storageKey,
      userEdgeStylesAtom: userEdgeStylesAtom.storageKey,
      graphViewLayoutAtom: graphViewLayoutAtom.storageKey,
      schemaViewLayoutAtom: schemaViewLayoutAtom.storageKey,
      allGraphSessionsAtom: allGraphSessionsAtom.storageKey,
      showDebugActionsAtom: showDebugActionsAtom.storageKey,
      allowLoggingDbQueryAtom: allowLoggingDbQueryAtom.storageKey,
      defaultNeighborExpansionLimitEnabledAtom:
        defaultNeighborExpansionLimitEnabledAtom.storageKey,
      defaultNeighborExpansionLimitAtom:
        defaultNeighborExpansionLimitAtom.storageKey,
      diagnosticLoggingAtom: diagnosticLoggingAtom.storageKey,
    }).toStrictEqual({
      activeConnectionIdAtom: "active-configuration",
      savedConnectionsAtom: "configuration",
      schemaAtom: "schema",
      userVertexStylesAtom: "user-vertex-styles",
      userEdgeStylesAtom: "user-edge-styles",
      graphViewLayoutAtom: "graph-view-layout",
      schemaViewLayoutAtom: "schema-view-layout",
      allGraphSessionsAtom: "graph-sessions",
      showDebugActionsAtom: "showDebugActions",
      allowLoggingDbQueryAtom: "allowLoggingDbQuery",
      defaultNeighborExpansionLimitEnabledAtom:
        "defaultNeighborExpansionLimitEnabled",
      defaultNeighborExpansionLimitAtom: "defaultNeighborExpansionLimit",
      diagnosticLoggingAtom: "diagnosticLogging",
    });
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
 * BACKWARD COMPATIBILITY: CONNECTIONS STORED BY EARLIER VERSIONS
 *
 * Earlier versions stored a connection with a `url`/`proxyConnection` pair.
 * The real `savedConnectionsAtom` must fold that shape into the canonical one
 * as `loadPersistedState()` loads it, so these tests seed IndexedDB and then
 * call `loadPersistedState()`. Removing `transform: transformSavedConnections` from its
 * `configuration` atom must fail them.
 *
 * DO NOT delete or weaken these tests without confirming no stored
 * connection can still carry the legacy shape.
 */
describe("backward compatibility: connections stored by earlier versions", () => {
  function storedConfig(connection: LegacyConnectionConfig): SavedConnection {
    return {
      ...createRandomSavedConnection(),
      // Stored data is not schema-validated on read.
      connection: connection as SavedConnection["connection"],
    };
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

    const { store, savedConnectionsAtom } =
      await preloadSavedConnections(config);

    expect(
      store.get(savedConnectionsAtom).get(config.id)?.connection,
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
    const { store, savedConnectionsAtom, persistenceStatusStore } =
      await preloadSavedConnections(storedByThisTab);

    // Another tab writes its own legacy entry alongside this tab's, directly
    // to storage, skipping this tab's in-memory atoms entirely.
    const storedByOtherTab = storedConfig({
      url: "https://proxy.example.com",
      proxyConnection: true,
      graphDbUrl: "https://neptune-b:8182",
    });
    await localforage.setItem(
      "configuration",
      new Map([
        [storedByThisTab.id, storedByThisTab],
        [storedByOtherTab.id, storedByOtherTab],
      ]),
    );
    const added = createRandomSavedConnection();
    store.set(savedConnectionsAtom, prev => new Map(prev).set(added.id, added));
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

describe("loadPersistedState", () => {
  it("runs the startup migrations before the atoms read storage", async () => {
    const edgeStyle: EdgeStyleStorage = {
      type: createEdgeType("knows"),
      lineColor: "#00ff00",
    };
    await localforage.setItem<LegacyUserStylingStorage>("user-styling", {
      edges: [edgeStyle],
    });

    await loadPersistedState();

    expect(createStore().get(userEdgeStylesAtom)).toStrictEqual(
      new Map([[edgeStyle.type, edgeStyle]]),
    );
  });

  it("seeds the stored value, not the default", async () => {
    await localforage.setItem("defaultNeighborExpansionLimit", 42);

    await loadPersistedState();

    expect(createStore().get(defaultNeighborExpansionLimitAtom)).toBe(42);
  });

  it("rejects with a PersistedStateLoadError that keeps the storage error as its cause", async () => {
    const storageError = new DOMException(
      "The database connection was lost.",
      "UnknownError",
    );
    vi.spyOn(localforage, "getItem").mockRejectedValue(storageError);

    const failure = await loadPersistedState().catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(PersistedStateLoadError);
    expect(failure).toHaveProperty("cause", storageError);
  });
});
