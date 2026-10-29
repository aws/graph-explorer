import { z } from "zod";

// Deep import: the `@/connections` index pulls in most of the app, including
// `localDb`, which would put `storageAtoms` in an import cycle.
// oxlint-disable-next-line no-restricted-imports
import { type ConnectionId, createConnectionId } from "@/connections/types";

import {
  createSessionScopedAtom,
  type SessionScopedAtomOptions,
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
const activeConnectionCodec: SessionValueCodec<ConnectionId | null> = {
  serialize: value => value,
  deserialize: raw => (raw ? createConnectionId(raw) : null),
  parseStored: stored => createConnectionId(z.string().parse(stored)),
};

const activeConnectionOptions: SessionScopedAtomOptions<ConnectionId | null> = {
  key: ACTIVE_CONNECTION_STORAGE_KEY,
  defaultValue: null,
  codec: activeConnectionCodec,
};

/**
 * Creates the app-wide atom holding this tab's active connection.
 *
 * The active connection is per-tab: it lives in sessionStorage so it survives a
 * reload of this tab but never leaks to other tabs, while a shared localForage
 * breadcrumb seeds a fresh tab on cold start. See {@link createSessionScopedAtom}
 * for the full seeding and write-through behavior.
 *
 * @param sessionStorage The per-tab storage backing. Injectable so multi-tab
 * isolation can be tested with separate storages.
 */
export function createActiveConnectionIdAtom({
  sessionStorage,
}: { sessionStorage?: Storage } = {}) {
  return createSessionScopedAtom({
    ...activeConnectionOptions,
    sessionStorage,
  });
}
