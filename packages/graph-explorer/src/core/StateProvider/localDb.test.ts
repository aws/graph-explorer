import { toJsonFileData } from "@/utils/fileData";
import {
  createRandomRawConfiguration,
  createRandomSchema,
} from "@/utils/testing";
import {
  createBackupData,
  type LocalDb,
  renameEntry,
  addRestoredPrefix,
  removePrefixFromRestoredEntries,
  hasRestoredPrefix,
  removeRestoredPrefix,
  readBackupDataFromFile,
  restoreBackup,
} from "./localDb";
import { serializeData } from "./serializeData";
import {
  createRandomDate,
  createRandomInteger,
  createRandomName,
} from "@shared/utils/testing";

describe("exportFromLocalForage", () => {
  let timestamp: Date;
  let appVersion: string;

  beforeEach(() => {
    // tell vitest we use mocked time
    vi.useFakeTimers();

    // set the system time to a random Date
    timestamp = createRandomDate();
    vi.setSystemTime(timestamp);

    // set a random app version
    appVersion = `${createRandomInteger()}.${createRandomInteger()}.${createRandomInteger()}`;
    vi.stubGlobal("__GRAPH_EXP_VERSION__", appVersion);
  });

  afterEach(() => {
    // restoring date after each test run
    vi.useRealTimers();
  });

  it("should return empty envelope when no data to backup", async () => {
    const localForage = createFakeLocalDb();
    const result = await createBackupData(localForage);

    expect(result).toEqual({
      backupSource: "Graph Explorer",
      backupSourceVersion: appVersion,
      backupTimestamp: timestamp,
      backupVersion: "1.0",
      data: {},
    });
  });

  it("should return envelope with data", async () => {
    const localDb = createFakeLocalDb();

    // set up data
    const config = createRandomRawConfiguration();
    const schema = createRandomSchema();
    const configMap = new Map([[config.id, config]]);
    const schemaMap = new Map([[config.id, schema]]);

    // add to storage
    localDb.setItem("schema", schemaMap);
    localDb.setItem("configuration", configMap);
    localDb.setItem("active-configuration", config.id);

    // perform backup
    const result = await createBackupData(localDb);

    expect(result).toEqual({
      backupSource: "Graph Explorer",
      backupSourceVersion: appVersion,
      backupTimestamp: timestamp,
      backupVersion: "1.0",
      data: {
        "active-configuration": config.id,
        configuration: configMap,
        schema: schemaMap,
      },
    });
  });

  it("should be able to restore", async () => {
    const localDb = createFakeLocalDb();

    // set up data
    const config = createRandomRawConfiguration();
    const schema = createRandomSchema();
    const configMap = new Map([[config.id, config]]);
    const schemaMap = new Map([[config.id, schema]]);

    // add to storage
    localDb.setItem("schema", schemaMap);
    localDb.setItem("configuration", configMap);
    localDb.setItem("active-configuration", config.id);

    // perform backup
    const backupBefore = await createBackupData(localDb);
    const serialized = serializeData(backupBefore);
    const blob = toJsonFileData(serialized);

    // perform restore
    const backupData = await readBackupDataFromFile(blob);
    await restoreBackup(backupData, localDb);

    // Verify
    const backupAfter = await createBackupData(localDb);
    expect(backupBefore).toEqual(backupAfter);
  });

  it("should be able to restore when previous restore goes wrong", async () => {
    const localDb = createFakeLocalDb();

    // set up data
    const config = createRandomRawConfiguration();
    const schema = createRandomSchema();
    const configMap = new Map([[config.id, config]]);
    const schemaMap = new Map([[config.id, schema]]);

    // add to storage
    localDb.setItem("schema", schemaMap);
    localDb.setItem("configuration", configMap);
    localDb.setItem("active-configuration", config.id);
    localDb.setItem(addRestoredPrefix("schema"), schemaMap);
    localDb.setItem(addRestoredPrefix("configuration"), configMap);
    localDb.setItem(addRestoredPrefix("active-configuration"), config.id);

    // perform backup
    const originalBackupData = await createBackupData(localDb);
    const serialized = serializeData(originalBackupData);
    const blob = toJsonFileData(serialized);

    // perform restore
    const backupData = await readBackupDataFromFile(blob);
    await restoreBackup(backupData, localDb);

    // Verify
    const keys = await localDb.keys();
    expect(keys).toEqual(
      expect.not.arrayContaining([
        addRestoredPrefix("schema"),
        addRestoredPrefix("configuration"),
        addRestoredPrefix("active-configuration"),
      ])
    );
  });

  it("should fail restore when not backup data", async () => {
    // set up data
    const config = createRandomRawConfiguration();
    const schema = createRandomSchema();
    const configMap = new Map([[config.id, config]]);
    const schemaMap = new Map([[config.id, schema]]);

    // No backup envelope
    const backupBefore = {
      schema: schemaMap,
      configuration: configMap,
      "active-configuration": config.id,
    };
    const serialized = serializeData(backupBefore);
    const blob = toJsonFileData(serialized);

    await expect(() => readBackupDataFromFile(blob)).rejects.toThrowError();
  });
});

test("Rename key", async () => {
  const localDb = createFakeLocalDb();
  const oldKey = createRandomName("OldKey");
  const newKey = createRandomName("NewKey");
  const value = createRandomName("Value");
  await localDb.setItem(oldKey, value);

  await renameEntry(oldKey, newKey, localDb);

  expect(await localDb.getItem(newKey)).toBe(value);
  expect(await localDb.getItem(oldKey)).toBeUndefined();
});

test("Add restored prefix", () => {
  const key = createRandomName("Key");
  expect(addRestoredPrefix(key)).toEqual(`RESTORED-ENTRY-${key}`);

  const resultWithoutPrefix = createRandomName("Key");
  expect(hasRestoredPrefix(resultWithoutPrefix)).toBeFalsy();
});

test("Has restored prefix", () => {
  const resultWithPrefix = addRestoredPrefix(createRandomName("Key"));
  expect(hasRestoredPrefix(resultWithPrefix)).toBeTruthy();

  const resultWithoutPrefix = createRandomName("Key");
  expect(hasRestoredPrefix(resultWithoutPrefix)).toBeFalsy();
});

test("Remove restored prefix", () => {
  const key = createRandomName("Key");
  const keyWithPrefix = addRestoredPrefix(key);
  const result = removeRestoredPrefix(keyWithPrefix);

  expect(result).toEqual(key);
  expect(keyWithPrefix).not.toEqual(key);
  expect(result).not.toEqual(keyWithPrefix);
});

test("Remove prefix from restored entries", async () => {
  const localDb = createFakeLocalDb([
    [createRandomName("Key"), createRandomName("Value")],
    [createRandomName("Key"), createRandomName("Value")],
    [
      `${addRestoredPrefix(createRandomName("Key"))}`,
      createRandomName("Value"),
    ],
    [
      `${addRestoredPrefix(createRandomName("Key"))}`,
      createRandomName("Value"),
    ],
  ]);

  await removePrefixFromRestoredEntries(localDb);

  const keys = await localDb.keys();
  expect(keys.filter(hasRestoredPrefix)).toHaveLength(0);
  expect(keys).toHaveLength(4);
});

/** Fake database using a map as the data source. */
export function createFakeLocalDb(
  initialState?: Iterable<readonly [string, any]> | null
): LocalDb {
  const map = new Map<string, any>(initialState);

  return {
    // eslint-disable-next-line @typescript-eslint/require-await
    async getItem<T>(key: string) {
      return map.get(key) as T;
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async setItem<T>(key: string, value: T) {
      map.set(key, value);
      return value;
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async removeItem(key) {
      map.delete(key);
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async clear() {
      map.clear();
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async keys() {
      return [...map.keys()];
    },
  };
}
