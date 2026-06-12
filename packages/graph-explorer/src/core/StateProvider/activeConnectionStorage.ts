import localForage from "localforage";

import type { ConfigurationId } from "../ConfigurationProvider";

import { resolveSessionStorage } from "./safeSessionStorage";
import { createWriteThroughAtom } from "./writeThroughAtom";

/**
 * Storage key for the active connection. Used for both the per-tab
 * sessionStorage value and the persisted localForage breadcrumb, so existing
 * users' stored value is reused with no migration.
 */
export const ACTIVE_CONNECTION_STORAGE_KEY = "active-configuration";

function readSessionValue(sessionStorage: Storage): ConfigurationId | null {
  // Treat an empty/corrupted value as a miss so it falls through to the
  // breadcrumb rather than seeding an invalid connection id.
  const value = sessionStorage.getItem(ACTIVE_CONNECTION_STORAGE_KEY);
  return value ? (value as ConfigurationId) : null;
}

/**
 * Creates the atom holding this tab's active connection.
 *
 * The active connection is per-tab: it lives in sessionStorage so it survives
 * a reload of this tab but never leaks to other tabs. Each write also updates a
 * shared, persisted breadcrumb in localForage; that breadcrumb is read only
 * once, here, to seed a fresh tab on cold start.
 *
 * Seeding order: this tab's sessionStorage value (warm reload) wins; otherwise
 * the persisted breadcrumb (cold start) seeds it. A cold-start seed is claimed
 * into this tab's sessionStorage so the tab owns that connection: a later
 * reload reads its own value back instead of re-seeding from a breadcrumb that
 * another tab may have since moved.
 *
 * @param sessionStorage The per-tab storage backing. Injectable so multi-tab
 * isolation can be tested with separate storages.
 */
export async function createActiveConfigurationAtom({
  sessionStorage = resolveSessionStorage(),
}: { sessionStorage?: Storage } = {}) {
  let seedValue = readSessionValue(sessionStorage);
  if (seedValue === null) {
    // Cold start: seed from the shared breadcrumb and claim it into this tab's
    // sessionStorage, so a later reload reads this value back rather than
    // re-seeding from a breadcrumb another tab may have since moved.
    seedValue = await localForage.getItem<ConfigurationId | null>(
      ACTIVE_CONNECTION_STORAGE_KEY,
    );
    if (seedValue !== null) {
      sessionStorage.setItem(ACTIVE_CONNECTION_STORAGE_KEY, seedValue);
    }
  }

  return createWriteThroughAtom<ConfigurationId | null>(
    seedValue,
    // sessionStorage updates synchronously; the returned promise tracks the
    // breadcrumb landing in localForage.
    async nextValue => {
      if (nextValue === null) {
        sessionStorage.removeItem(ACTIVE_CONNECTION_STORAGE_KEY);
      } else {
        sessionStorage.setItem(ACTIVE_CONNECTION_STORAGE_KEY, nextValue);
      }
      await localForage.setItem(ACTIVE_CONNECTION_STORAGE_KEY, nextValue);
    },
    "activeConfigurationAtom",
  );
}
