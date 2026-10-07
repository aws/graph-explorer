// @vitest-environment happy-dom
import localforage from "localforage";
import { beforeEach, describe, expect, test } from "vitest";

import { createNewConnectionId, type SavedConnection } from "@/connections";
import {
  createRandomSavedConnection,
  createRandomSchema,
  loadStorageAtoms,
  preloadSavedConnections,
} from "@/utils/testing";

import type { SchemaStorageModel } from "./schema";

import legacyUrlBackup from "./__fixtures__/backup-v1-legacy-url-connections.json?raw";
import { readBackupDataFromFile, restoreBackup } from "./localDb";

/**
 * BACKWARD COMPATIBILITY — STORED CONNECTION SHAPES
 *
 * These tests preload the "configuration" and "active-configuration" storage
 * as older builds left them, through the real storage atoms. The transform is
 * covered on its own in `@/connections/legacyConnection.test.ts`; here we pin
 * the shapes that reach the atom untouched, the storage keys the Active
 * Connection is read from, and a backup file from an older build restoring
 * into what the app loads.
 *
 * Storage keys are string literals on purpose: they are the on-disk contract,
 * so renaming the constant that holds one must fail here.
 *
 * DO NOT delete or weaken these without confirming that no stored connection
 * in the wild can still be in these shapes.
 */
describe("backward compatibility: stored connection shapes preload through the configuration atom", () => {
  // A "nested" entry: before schema was stored separately in `schemaAtom`, an
  // older build embedded the whole schema inside the stored `SavedConnection`.
  // The current type no longer declares `schema`, so we cast to attach it,
  // simulating a stale IndexedDB blob. The preload must carry it through
  // untouched rather than choke on the unexpected nesting.
  test("preserves an entry carrying a legacy embedded schema", async () => {
    const config = createRandomSavedConnection();
    const nestedConfig = {
      ...config,
      schema: createRandomSchema(),
    } as SavedConnection & { schema: SchemaStorageModel };

    const { store, savedConnectionsAtom } =
      await preloadSavedConnections(nestedConfig);
    const loaded = store.get(savedConnectionsAtom).get(config.id);

    expect(loaded).toStrictEqual(nestedConfig);
  });

  test("preserves an entry that has no connection", async () => {
    const config: SavedConnection = {
      ...createRandomSavedConnection(),
      connection: undefined,
    };

    const { store, savedConnectionsAtom } =
      await preloadSavedConnections(config);
    const loaded = store.get(savedConnectionsAtom).get(config.id);

    expect(loaded).toStrictEqual(config);
  });

  test("preserves an entry with no displayLabel", async () => {
    const { displayLabel: _omit, ...config } = createRandomSavedConnection();

    const { store, savedConnectionsAtom } =
      await preloadSavedConnections(config);
    const loaded = store.get(savedConnectionsAtom).get(config.id);

    // The destructured `config` already omits `displayLabel`, so a full-value
    // compare pins both that it stays absent and that nothing else drifts.
    expect(loaded).toStrictEqual(config);
  });

  test("preloads several stored connections together", async () => {
    const first = createRandomSavedConnection();
    const second = createRandomSavedConnection();
    const third = createRandomSavedConnection();

    const { store, savedConnectionsAtom } = await preloadSavedConnections(
      first,
      second,
      third,
    );
    const loaded = store.get(savedConnectionsAtom);

    expect([...loaded.keys()]).toStrictEqual([first.id, second.id, third.id]);
    expect(loaded.get(second.id)?.connection).toStrictEqual(second.connection);
  });
});

describe("backward compatibility: the Active Connection is read from its stored keys", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test("seeds a new tab from the breadcrumb stored under active-configuration", async () => {
    const id = createNewConnectionId();
    await localforage.setItem("active-configuration", id);

    const { store, activeConnectionIdAtom } = await loadStorageAtoms();

    expect(store.get(activeConnectionIdAtom)).toBe(id);
  });

  test("keeps a reloaded tab on the value it stored under active-configuration", async () => {
    const tabValue = createNewConnectionId();
    await localforage.setItem("active-configuration", createNewConnectionId());
    sessionStorage.setItem("active-configuration", tabValue);

    const { store, activeConnectionIdAtom } = await loadStorageAtoms();

    expect(store.get(activeConnectionIdAtom)).toBe(tabValue);
  });
});

/**
 * GOLDEN FILE — `__fixtures__/backup-v1-legacy-url-connections.json` is a
 * backup in the shape a 2.x build wrote: the `serializeData` Map and Date
 * wrappers, and connections in the legacy `url`/`proxyConnection` shape. It is
 * loaded with `?raw` so the exact bytes are parsed, not a re-serialized object.
 *
 * DO NOT edit the fixture to make a test pass; fix the reader instead.
 */
describe("backward compatibility: a backup file from an older build restores", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test("brings the connections and Active Connection back into what the app loads", async () => {
    const backup = await readBackupDataFromFile(
      new Blob([legacyUrlBackup], { type: "application/json" }),
    );
    await restoreBackup(backup, localforage);

    const { store, savedConnectionsAtom, activeConnectionIdAtom } =
      await loadStorageAtoms();

    expect(store.get(activeConnectionIdAtom)).toBe(
      "22222222-2222-4222-8222-222222222222",
    );
    expect(store.get(savedConnectionsAtom)).toStrictEqual(
      new Map([
        [
          "11111111-1111-4111-8111-111111111111",
          {
            id: "11111111-1111-4111-8111-111111111111",
            displayLabel: "Legacy Neptune (proxy)",
            connection: {
              queryEngine: "gremlin",
              graphDbUrl: "https://neptune.example.com:8182",
              awsAuthEnabled: true,
              serviceType: "neptune-db",
              awsRegion: "us-west-2",
              fetchTimeoutMs: 30000,
              nodeExpansionLimit: 25,
            },
          },
        ],
        [
          "22222222-2222-4222-8222-222222222222",
          {
            id: "22222222-2222-4222-8222-222222222222",
            displayLabel: "Legacy Gremlin Server (direct)",
            connection: {
              queryEngine: "openCypher",
              graphDbUrl: "http://localhost:8182",
              proxyConnection: false,
            },
          },
        ],
      ]),
    );
  });
});
