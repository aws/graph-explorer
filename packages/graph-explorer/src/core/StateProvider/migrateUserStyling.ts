import localForage from "localforage";

import type { EdgeType, VertexType } from "../entities";
import type {
  EdgePreferencesStorageModel,
  UserStyling,
  VertexPreferencesStorageModel,
} from "./userPreferences";

/**
 * Migrates legacy `"user-styling"` data into the type-keyed `"vertex-styles"`
 * and `"edge-styles"` maps.
 *
 * Runs once at startup, before the styling atoms are created. It is idempotent
 * and gated solely on the presence of the new keys, so a partial write (the two
 * `setItem` calls are not atomic) is recoverable on the next load. Fresh users
 * with no stored styling are a no-op.
 *
 * The old `"user-styling"` key is intentionally left in place as a rollback
 * escape hatch; removing it is a separate follow-up.
 */
export async function migrateUserStylingIfNeeded() {
  const alreadyMigrated =
    (await localForage.getItem("vertex-styles")) !== null ||
    (await localForage.getItem("edge-styles")) !== null;
  if (alreadyMigrated) {
    return;
  }

  const old = await localForage.getItem<UserStyling>("user-styling");
  if (!old) {
    return;
  }

  await localForage.setItem(
    "vertex-styles",
    new Map<VertexType, VertexPreferencesStorageModel>(
      (old.vertices ?? []).map(vertex => [vertex.type, vertex]),
    ),
  );
  await localForage.setItem(
    "edge-styles",
    new Map<EdgeType, EdgePreferencesStorageModel>(
      (old.edges ?? []).map(edge => [edge.type, edge]),
    ),
  );
}
