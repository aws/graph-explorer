// @vitest-environment happy-dom
import { describe, expect, test } from "vitest";

import type { RawConfiguration } from "@/core";

import { toJsonFileData } from "@/utils/fileData";
import {
  createRandomRawConfiguration,
  createRandomSchema,
  preloadStoredConfigurations,
} from "@/utils/testing";

import type { SchemaStorageModel } from "./schema";

import { ACTIVE_CONNECTION_STORAGE_KEY } from "./activeConnectionStorage";
import {
  createBackupData,
  type LocalDb,
  readBackupDataFromFile,
  restoreBackup,
} from "./localDb";
import { serializeData } from "./serializeData";

/**
 * BACKWARD COMPATIBILITY — STORED CONNECTION SHAPES
 *
 * These tests preload the "configuration" and "active-configuration" storage
 * as older builds left them, through the real `configurationAtom` load path,
 * before the Connections refactor moves that code. The transform is covered on
 * its own in `configurationTransform.test.ts`; here we pin the shapes that
 * reach the atom untouched — an entry with no connection, a missing
 * `displayLabel`, and several connections preloading together — plus a
 * full backup restore bringing the connections and Active Connection back.
 *
 * DO NOT delete or weaken these without confirming that no stored connection
 * in the wild can still be in these shapes.
 */
describe("backward compatibility: stored connection shapes preload through the configuration atom", () => {
  // A "nested" entry: before schema was stored separately in `schemaAtom`, an
  // older build embedded the whole schema inside the stored `RawConfiguration`.
  // The current type no longer declares `schema`, so we cast to attach it,
  // simulating a stale IndexedDB blob. The preload must carry it through
  // untouched rather than choke on the unexpected nesting.
  test("preserves an entry carrying a legacy embedded schema", async () => {
    const config = createRandomRawConfiguration();
    const nestedConfig = {
      ...config,
      schema: createRandomSchema(),
    } as RawConfiguration & { schema: SchemaStorageModel };

    const { store, configurationAtom } =
      await preloadStoredConfigurations(nestedConfig);
    const loaded = store.get(configurationAtom).get(config.id);

    expect(loaded).toStrictEqual(nestedConfig);
  });

  test("preserves an entry that has no connection", async () => {
    const config: RawConfiguration = {
      ...createRandomRawConfiguration(),
      connection: undefined,
    };

    const { store, configurationAtom } =
      await preloadStoredConfigurations(config);
    const loaded = store.get(configurationAtom).get(config.id);

    expect(loaded).toStrictEqual(config);
  });

  test("preserves an entry with no displayLabel", async () => {
    const { displayLabel: _omit, ...config } = createRandomRawConfiguration();

    const { store, configurationAtom } =
      await preloadStoredConfigurations(config);
    const loaded = store.get(configurationAtom).get(config.id);

    // The destructured `config` already omits `displayLabel`, so a full-value
    // compare pins both that it stays absent and that nothing else drifts.
    expect(loaded).toStrictEqual(config);
  });

  test("preloads several stored connections together", async () => {
    const first = createRandomRawConfiguration();
    const second = createRandomRawConfiguration();
    const third = createRandomRawConfiguration();

    const { store, configurationAtom } = await preloadStoredConfigurations(
      first,
      second,
      third,
    );
    const loaded = store.get(configurationAtom);

    expect([...loaded.keys()]).toStrictEqual([first.id, second.id, third.id]);
    expect(loaded.get(second.id)?.connection).toStrictEqual(second.connection);
  });
});

describe("backward compatibility: a backup from an older build restores", () => {
  test("brings the connections and Active Connection back", async () => {
    const source = createFakeLocalDb();
    const first = createRandomRawConfiguration();
    const second = createRandomRawConfiguration();
    const configMap = new Map([
      [first.id, first],
      [second.id, second],
    ]);

    source.setItem("configuration", configMap);
    source.setItem(ACTIVE_CONNECTION_STORAGE_KEY, first.id);

    // Snapshot -> serialize -> file -> parse, exactly as an export/import does.
    const backup = await createBackupData(source);
    const parsed = await readBackupDataFromFile(
      toJsonFileData(serializeData(backup)),
    );

    // Restore into a fresh, empty database, as importing into a clean install.
    const target = createFakeLocalDb();
    await restoreBackup(parsed, target);

    const restoredConfigs =
      await target.getItem<typeof configMap>("configuration");
    expect(restoredConfigs?.get(first.id)?.connection).toStrictEqual(
      first.connection,
    );
    expect(restoredConfigs?.get(second.id)?.connection).toStrictEqual(
      second.connection,
    );
    expect(await target.getItem(ACTIVE_CONNECTION_STORAGE_KEY)).toBe(first.id);
  });
});

/** Fake database backed by a Map, mirroring the one in `localDb.test.ts`. */
function createFakeLocalDb(): LocalDb {
  const map = new Map<string, unknown>();
  return {
    // oxlint-disable-next-line @typescript-eslint/require-await
    async getItem<T>(key: string) {
      return map.get(key) as T;
    },
    // oxlint-disable-next-line @typescript-eslint/require-await
    async setItem<T>(key: string, value: T) {
      map.set(key, value);
      return value;
    },
    // oxlint-disable-next-line @typescript-eslint/require-await
    async removeItem(key: string) {
      map.delete(key);
    },
    // oxlint-disable-next-line @typescript-eslint/require-await
    async keys() {
      return [...map.keys()];
    },
    // oxlint-disable-next-line @typescript-eslint/require-await
    async clear() {
      map.clear();
    },
  };
}
