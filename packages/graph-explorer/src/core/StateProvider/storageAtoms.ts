import type {
  ConfigurationId,
  RawConfiguration,
} from "../ConfigurationProvider";
import type { EdgeType, VertexType } from "../entities";
import type { GraphSessionStorageModel } from "./graphSession/storage";
import type { SchemaStorageModel } from "./schema";
import type {
  EdgePreferencesStorageModel,
  VertexPreferencesStorageModel,
} from "./userPreferences";

import { createActiveConfigurationAtom } from "./activeConnectionStorage";
import { atomWithLocalForage } from "./atomWithLocalForage";
import { migrateUserStylingIfNeeded } from "./migrateUserStyling";
import { defaultUserLayout } from "./userLayoutDefaults";
import { markUserStylingMigrationFailed } from "./userStylingMigrationStatus";

// Convert any legacy single-key user styling into the type-keyed map atoms
// below before they preload. Must run before the `Promise.all`. Errors are
// caught so a migration failure does not crash the module and leave all atoms
// undefined. The legacy `"user-styling"` key is never deleted, so the data is
// preserved on disk; we record the failure here and surface it to the user
// once React mounts (see `useReportUserStylingMigrationFailure`).
try {
  await migrateUserStylingIfNeeded();
} catch (err) {
  markUserStylingMigrationFailed();
  console.error(
    "[graph-explorer] User styling migration failed; previous styling is preserved and will be retried on next reload.",
    err,
  );
}

/**
 DEV NOTE

 These atoms are the ones that integrate Jotai with data stored in LocalForage
 (IndexedDB).

 I've tried many approaches to preload the LocalForage data in to Jotai before
 the app loads fully, but all attempts have not gone well. If we don't preload
 the data then the app loads with the incorrect data (initial value) then flips
 to the actual data from LocalForage. This might lead to strange behavior that
 can leave the app in a bad or unexpected state.

 To provide some more predictability, we have two options:

 1. Make all interactions with this state async
 2. Cache the LocalForage data and synchronize the state in the background

 Making interactions async leads to a giant mess of async code across the entire
 app, since this data is central to nearly every single piece of logic in the
 codebase. It can also lead to flashes of React suspense boundaries showing when
 it's not expected if done poorly.

 Caching the LocalForage data and synchronizing works well, if you can ensure
 the data is preloaded into the Jotai atoms before use. The Jotai provided
 approach is to preload within the `onMount` event. This will replace the
 initial value with the actual value after the async `getItem()` function
 resolves. This leads to the unexpected states I mentioned earlier, which
 essentially are the result of race conditions.

 Instead, I've landed on making the creation of the atoms async, and keeping the
 interactions sync. This moves the pre-load to before React even loads. This
 guarantees the data is preloaded fully. All LocalForage atoms were moved to
 this file in order to preload the data in parallel, reducing the startup time
 of the app on slower machines.
 */

const [
  activeConfigurationAtom,
  configurationAtom,
  schemaAtom,
  vertexStylesAtom,
  edgeStylesAtom,
  userLayoutAtom,
  allGraphSessionsAtom,
  showDebugActionsAtom,
  allowLoggingDbQueryAtom,
  defaultNeighborExpansionLimitEnabledAtom,
  defaultNeighborExpansionLimitAtom,
  diagnosticLoggingAtom,
] = await Promise.all([
  createActiveConfigurationAtom(),
  atomWithLocalForage<Map<ConfigurationId, RawConfiguration>>(
    "configuration",
    new Map(),
  ),
  /** All the stored schemas */
  atomWithLocalForage("schema", new Map<string, SchemaStorageModel>()),
  /** User styling for vertex types, keyed by type. */
  atomWithLocalForage(
    "vertex-styles",
    new Map<VertexType, VertexPreferencesStorageModel>(),
  ),
  /** User styling for edge types, keyed by type. */
  atomWithLocalForage(
    "edge-styles",
    new Map<EdgeType, EdgePreferencesStorageModel>(),
  ),
  atomWithLocalForage("user-layout", defaultUserLayout),
  /** Stores the graph session data for each connection. */
  atomWithLocalForage<Map<ConfigurationId, GraphSessionStorageModel>>(
    "graph-sessions",
    new Map(),
  ),
  /*
   * General App Settings
   */
  /** Shows debug actions in various places around the app. */
  atomWithLocalForage<boolean>("showDebugActions", false),
  /** Enables logging of generated database queries on the proxy server. */
  atomWithLocalForage<boolean>("allowLoggingDbQuery", false),
  /** Setting that enables/disables the default limit for neighbor expansion. */
  atomWithLocalForage<boolean>("defaultNeighborExpansionLimitEnabled", true),
  /** Setting that defines the default limit for neighbor expansion. */
  atomWithLocalForage<number>("defaultNeighborExpansionLimit", 10),
  /** Enables verbose diagnostic logging to the browser console. */
  atomWithLocalForage<boolean>("diagnosticLogging", false),
]);

export {
  activeConfigurationAtom,
  configurationAtom,
  schemaAtom,
  vertexStylesAtom,
  edgeStylesAtom,
  userLayoutAtom,
  allGraphSessionsAtom,
  showDebugActionsAtom,
  allowLoggingDbQueryAtom,
  defaultNeighborExpansionLimitEnabledAtom,
  defaultNeighborExpansionLimitAtom,
  diagnosticLoggingAtom,
};
