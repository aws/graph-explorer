import localForage from "localforage";

import type { EdgeType, VertexType } from "../entities";
import type { LegacyUserStylingStorageModel } from "./userPreferences";

/**
 * Migrates legacy `"user-styling"` data into the type-keyed `"vertex-styles"`
 * and `"edge-styles"` maps.
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
    localForage.getItem("vertex-styles"),
    localForage.getItem("edge-styles"),
  ]);

  const vertexStylesMissing = existingVertexStyles === null;
  const edgeStylesMissing = existingEdgeStyles === null;
  if (!vertexStylesMissing && !edgeStylesMissing) {
    return;
  }

  const old =
    await localForage.getItem<LegacyUserStylingStorageModel>("user-styling");
  if (!old) {
    return;
  }

  // Only write the key(s) still missing. A key that already exists may hold
  // edits made after a prior migration, which the stale legacy snapshot would
  // overwrite.
  if (vertexStylesMissing) {
    await localForage.setItem(
      "vertex-styles",
      toTypeKeyedMap(old.vertices ?? [], "vertex"),
    );
  }
  if (edgeStylesMissing) {
    await localForage.setItem(
      "edge-styles",
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
      console.warn(
        `[graph-explorer] Duplicate ${label} type "${item.type}" found in legacy user-styling data; keeping the last entry.`,
      );
    }
    map.set(item.type, item);
  }
  return map;
}
