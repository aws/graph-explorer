import localForage from "localforage";

import type { EdgeType, VertexType } from "../entities";
import type { LegacyUserStylingStorageModel } from "./userPreferences";

/**
 * Migrates legacy `"user-styling"` data into the type-keyed `"vertex-styles"`
 * and `"edge-styles"` maps.
 *
 * Runs once at startup, before the styling atoms are created. It is idempotent
 * and gated on both new keys being present, so a partial write (the two
 * `setItem` calls are not atomic) is recoverable on the next load — the
 * migration re-runs if either key is missing. Fresh users with no stored
 * styling are a no-op.
 *
 * The old `"user-styling"` key is intentionally left in place as a rollback
 * escape hatch; removing it is a separate follow-up.
 */
export async function migrateUserStylingIfNeeded() {
  const alreadyMigrated =
    (await localForage.getItem("vertex-styles")) !== null &&
    (await localForage.getItem("edge-styles")) !== null;
  if (alreadyMigrated) {
    return;
  }

  const old =
    await localForage.getItem<LegacyUserStylingStorageModel>("user-styling");
  if (!old) {
    return;
  }

  await localForage.setItem(
    "vertex-styles",
    toTypeKeyedMap(old.vertices ?? [], "vertex"),
  );
  await localForage.setItem(
    "edge-styles",
    toTypeKeyedMap(old.edges ?? [], "edge"),
  );
}

function toTypeKeyedMap<T extends { type: VertexType | EdgeType }>(
  items: T[],
  label: string,
): Map<T["type"], T> {
  const map = new Map<T["type"], T>();
  for (const item of items) {
    if (map.has(item.type)) {
      console.warn(
        `[graph-explorer] Duplicate ${label} type "${item.type}" found in legacy user-styling data; keeping the last entry.`,
      );
    }
    map.set(item.type, item);
  }
  return map;
}
