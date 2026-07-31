import localForage from "localforage";

import { logger } from "@/utils";
import { createErrorDetails } from "@/utils/createErrorDetails";

import type { EdgeType, VertexType } from "../entities";
import type { LegacyUserStylingStorage } from "./graphStyles";

import { persistenceStatusStore } from "./persistence";
import { classifyStorageError } from "./persistence/classifyStorageError";

/**
 * The synthetic persistence-status key a migration failure is reported under.
 * Intentionally distinct from any `atomWithLocalForage` storage key so it never
 * receives a successful write that would auto-clear it — the failure stays
 * outstanding until the next reload re-runs the migration.
 */
const MIGRATION_STATUS_KEY = "user-styling-migration";

/**
 * Runs the user-styling migration at startup, reporting any failure through the
 * shared persistence-status store rather than crashing the caller.
 *
 * A migration failure is a storage failure, so it flows through the same
 * channel as every other IndexedDB write failure: the "Changes not saved"
 * indicator lights up and its dialog shows this error alongside the rest. The
 * legacy `"user-styling"` key is never deleted, so the data is preserved on
 * disk and the migration retries on the next reload.
 */
export async function runUserStylingMigration() {
  try {
    await migrateUserStylingIfNeeded();
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
 * Migrates legacy `"user-styling"` data into the type-keyed `"user-vertex-styles"`
 * and `"user-edge-styles"` maps.
 *
 * Runs once at startup, before the styling atoms are created. It is idempotent
 * and only writes the new keys that are still missing, so a partial write (the
 * two `setItem` calls are not atomic) is recovered on the next load without
 * clobbering a surviving key that the user may have since edited. Fresh users
 * with no stored styling are a no-op.
 *
 * The old `"user-styling"` key is intentionally left in place as a rollback
 * escape hatch; removing it is a separate follow-up. Because it is never
 * updated after migration, we must not overwrite an already-migrated key from
 * it — doing so would discard edits made after the first migration.
 */
export async function migrateUserStylingIfNeeded() {
  const [existingVertexStyles, existingEdgeStyles] = await Promise.all([
    localForage.getItem("user-vertex-styles"),
    localForage.getItem("user-edge-styles"),
  ]);

  const vertexStylesMissing = existingVertexStyles === null;
  const edgeStylesMissing = existingEdgeStyles === null;
  if (!vertexStylesMissing && !edgeStylesMissing) {
    return;
  }

  const old =
    await localForage.getItem<LegacyUserStylingStorage>("user-styling");
  if (!old) {
    return;
  }

  // Only write the key(s) still missing. A key that already exists may hold
  // edits made after a prior migration, which the stale legacy snapshot would
  // overwrite.
  if (vertexStylesMissing) {
    logger.debug(
      `[user-styling-migration] migrating "user-styling" into "user-vertex-styles"`,
    );
    await localForage.setItem(
      "user-vertex-styles",
      toTypeKeyedMap(old.vertices ?? [], "vertex"),
    );
  }
  if (edgeStylesMissing) {
    logger.debug(
      `[user-styling-migration] migrating "user-styling" into "user-edge-styles"`,
    );
    await localForage.setItem(
      "user-edge-styles",
      toTypeKeyedMap(old.edges ?? [], "edge"),
    );
  }
}

function toTypeKeyedMap<T extends { type: VertexType | EdgeType }>(
  items: T[],
  label: "vertex" | "edge",
): Map<T["type"], T> {
  const map = new Map<T["type"], T>();
  for (const item of items) {
    if (map.has(item.type)) {
      logger.warn(
        `[user-styling-migration] Duplicate ${label} type "${item.type}" found in legacy user-styling data; keeping the last entry.`,
      );
    }
    map.set(item.type, item);
  }
  return map;
}
