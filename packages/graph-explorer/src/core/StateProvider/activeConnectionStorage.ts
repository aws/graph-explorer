import type { ConfigurationId } from "../ConfigurationProvider";

import {
  createSessionScopedAtom,
  type SessionValueCodec,
} from "./sessionScopedStorage";

/**
 * Storage key for the active connection. Used for both the per-tab
 * sessionStorage value and the persisted localForage breadcrumb, so existing
 * users' stored value is reused with no migration.
 */
export const ACTIVE_CONNECTION_STORAGE_KEY = "active-configuration";

/**
 * The active connection id is a bare string, so it round-trips as-is rather
 * than through JSON. An empty/cleared value reads back as a miss so seeding
 * falls through to the breadcrumb instead of an invalid connection id.
 */
const activeConnectionCodec: SessionValueCodec<ConfigurationId | null> = {
  serialize: value => value,
  deserialize: raw => (raw ? (raw as ConfigurationId) : null),
};

/**
 * Creates the atom holding this tab's active connection.
 *
 * The active connection is per-tab: it lives in sessionStorage so it survives a
 * reload of this tab but never leaks to other tabs, while a shared localForage
 * breadcrumb seeds a fresh tab on cold start. See {@link createSessionScopedAtom}
 * for the full seeding and write-through behavior.
 *
 * @param sessionStorage The per-tab storage backing. Injectable so multi-tab
 * isolation can be tested with separate storages.
 */
export async function createActiveConfigurationAtom({
  sessionStorage,
}: { sessionStorage?: Storage } = {}) {
  return createSessionScopedAtom<ConfigurationId | null>({
    key: ACTIVE_CONNECTION_STORAGE_KEY,
    defaultValue: null,
    codec: activeConnectionCodec,
    sessionStorage,
  });
}
