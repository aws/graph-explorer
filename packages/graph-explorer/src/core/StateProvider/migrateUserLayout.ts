import localForage from "localforage";

import { logger } from "@/utils";
import { createErrorDetails } from "@/utils/createErrorDetails";

import { persistenceStatusStore } from "./persistence";
import { classifyStorageError } from "./persistence/classifyStorageError";

const MIGRATION_STATUS_KEY = "user-layout-migration";

/**
 * Runs the user-layout → graph-view-layout migration at startup, reporting
 * any failure through the persistence-status store rather than crashing the app.
 */
export async function runUserLayoutMigration() {
  try {
    await migrateUserLayoutIfNeeded();
  } catch (err) {
    persistenceStatusStore.markFailed(
      MIGRATION_STATUS_KEY,
      classifyStorageError(err),
      1,
      createErrorDetails(err),
    );
  }
}

/**
 * Migrates the legacy `"user-layout"` key to `"graph-view-layout"`.
 *
 * Idempotent: only writes when the new key is missing. The old key is left in
 * place as a rollback escape hatch.
 */
export async function migrateUserLayoutIfNeeded() {
  const existing = await localForage.getItem("graph-view-layout");
  if (existing !== null) {
    return;
  }

  const old = await localForage.getItem("user-layout");
  if (old === null) {
    return;
  }

  logger.debug(
    `[user-layout-migration] migrating "user-layout" into "graph-view-layout"`,
  );
  await localForage.setItem("graph-view-layout", old);
}
