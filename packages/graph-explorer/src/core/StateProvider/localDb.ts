import saveAs from "file-saver";
import { z } from "zod";

import { logger } from "@/utils";
import { LABELS } from "@/utils/constants";
import { fromFileToJson, toJsonFileData } from "@/utils/fileData";

import { deserializeData, serializeData } from "./serializeData";

/*

# Dev Notes

The backup & restore process is a bit complex. Here is how the process breaks
down.

## Backup Process

This process will create a JSON file with all the contents of the localForage
storage, along with some extra metadata.

1. Clean up any left over restored entries from previous failed restores.
2. Gather all data from localForage storage.
3. Wrap in backup envelope with some metadata about the backup.
4. Transform data to a format that is safe to serialize to a file.
5. Transform data in to binary blob data.
6. Save to file

## File Load Process

This process will convert the binary data in the file to a JSON structure that
can be restored. The actual restoration process is separate. This step is used
as a validation of the backup data in the file.

1. Transform binary blob data to file safe JSON data.
2. Transform file safe JSON data to normal JSON data.
3. Parse JSON data as backup data.

## Restore Process

Since we don't have transactions, we take a cautious approach to the restore
process. We attempt to write all entries from the backup file to the localForage
storage. If this succeeds, then we remove the old entries and rename the
restored entries.

If there is a failure during the writing of the restore entries then the
existing database is left in a working state.

1. Clean up any left over restored entries from previous failed restores.
2. Write all the backup data entries to localForage with "restored" prefix.
3. Delete all non-restored entries.
4. Rename all restored entries by removing prefix.

*/

/**
 * Backs up the localDb to a file
 * @param localDb The localForage instance.
 */
export async function saveLocalForageToFile(localDb: LocalDb) {
  const backup = await createBackupData(localDb);
  const serializedExportData = serializeData(backup);
  logger.debug("Backup serialized for file", serializedExportData);
  const fileData = toJsonFileData(serializedExportData);
  logger.debug(`Converted data to JSON file blob`);
  const fileName = "graph-explorer-config.json";
  saveAs(fileData, fileName);
  logger.debug(`Saved config data as ${fileName}`);
}

/**
 * Reads the given blob, verifies it is a backup file, restores the data localDb.
 * @param blob A serialized binary JSON data blob.
 * @returns Deserialized and parsed backup data.
 */
export async function readBackupDataFromFile(blob: Blob) {
  const jsonData = await fromFileToJson(blob);
  logger.debug("Deserialized JSON data from file blob", jsonData);
  const deserializedData = deserializeData(jsonData);
  logger.debug(
    "Deserialized JSON data from JSON serialization",
    deserializedData,
  );
  const result = await SerializedBackupSchema.parseAsync(deserializedData);
  logger.debug("Parsed backup result", result);
  return result;
}

/**
 * Applies the given backup data to the localDb, overwriting all contents.
 * @param backup The backup data to restore.
 * @param localDb The target localForage instance for the restore.
 */
export async function restoreBackup(
  backup: SerializedBackup,
  localDb: LocalDb,
) {
  logger.debug("Restoring backup to local db", backup);
  await removeRestoredEntries(localDb);
  const entries = applyRestorePrefixToEntries(backup.data);
  await saveEntriesToDb(entries, localDb);
  await removeExistingEntries(localDb);
  await removePrefixFromRestoredEntries(localDb);

  const appliedBackupState = await createBackupData(localDb);
  logger.debug("Backup restored to local db", appliedBackupState);
}

/** Abstraction over localForage to ease testing. */
export interface LocalDb {
  keys(): Promise<string[]>;
  clear(): Promise<void>;
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<T>;
  removeItem(key: string): Promise<void>;
}

/** Serialized backup data structure schema. This allows validation and parsing of `unknown` data. */
const SerializedBackupSchema = z.object({
  backupSource: z.string(),
  backupSourceVersion: z.string(),
  backupVersion: z.string(),
  backupTimestamp: z.coerce.date(),
  data: z.record(z.string(), z.unknown()),
});

export type SerializedBackup = z.infer<typeof SerializedBackupSchema>;

export async function createBackupData(localDb: LocalDb) {
  await removeRestoredEntries(localDb);

  logger.debug("Gathering entries from localDb");
  const backupData = Object.fromEntries(await getEntries(localDb));

  const result: SerializedBackup = {
    backupSource: LABELS.APP_NAME,
    backupSourceVersion: __GRAPH_EXP_VERSION__,
    backupVersion: "1.0",
    backupTimestamp: new Date(),
    data: backupData,
  };

  logger.debug(`Backup created`, result);

  return result;
}

async function getEntries(localDb: LocalDb) {
  const keys = await localDb.keys();

  return await Promise.all(
    keys.map(async key => [key, await localDb.getItem(key)]),
  );
}

export async function removeRestoredEntries(localDb: LocalDb) {
  const keys = (await localDb.keys()).filter(hasRestoredPrefix);

  logger.log(`Found ${keys.length} restored entries to be removed.`);

  for (const key of keys) {
    logger.debug("Removing entry", key);
    await localDb.removeItem(key);
  }
}

export async function removeExistingEntries(localDb: LocalDb) {
  const keys = (await localDb.keys()).filter(missingRestoredPrefix);

  logger.log(`Found ${keys.length} existing entries to be removed.`);

  for (const key of keys) {
    logger.debug("Removing entry", key);
    await localDb.removeItem(key);
  }
}

const restoredEntryPrefix = "RESTORED-ENTRY-";

function applyRestorePrefixToEntries(data: Record<string, unknown>) {
  return Object.entries(data).map(
    ([key, value]) => [addRestoredPrefix(key), value] as const,
  );
}

export function addRestoredPrefix(key: string) {
  return `${restoredEntryPrefix}${key}`;
}

export function removeRestoredPrefix(key: string) {
  return key.replace(restoredEntryPrefix, "");
}

export function hasRestoredPrefix(key: string) {
  return key.startsWith(restoredEntryPrefix);
}

export function missingRestoredPrefix(key: string) {
  return !hasRestoredPrefix(key);
}

export async function saveEntriesToDb(
  entries: (readonly [string, unknown])[],
  localDb: LocalDb,
) {
  for (const [key, value] of entries) {
    logger.debug("Saving entry to db", {
      key,
      value,
    });
    await localDb.setItem(key, value);
  }
}

export async function removePrefixFromRestoredEntries(localDb: LocalDb) {
  const keys = (await localDb.keys()).filter(hasRestoredPrefix);

  logger.log(`Found ${keys.length} restored entries to be removed.`);

  for (const key of keys) {
    const renamedKey = removeRestoredPrefix(key);
    await renameEntry(key, renamedKey, localDb);
  }
}

export async function renameEntry(
  oldKey: string,
  newKey: string,
  localDb: LocalDb,
) {
  logger.debug("Renaming entry", { oldKey, newKey });

  const value = await localDb.getItem(oldKey);
  await localDb.setItem(newKey, value);
  await localDb.removeItem(oldKey);
}
