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
import { atomWithLocalForage, reconcileMapByKey } from "./atomWithLocalForage";
import { defaultGraphViewLayout } from "./graphViewLayoutDefaults";
import { runUserLayoutMigration } from "./migrateUserLayout";
import { runUserStylingMigration } from "./migrateUserStyling";
import { defaultSchemaViewLayout } from "./schemaViewLayoutDefaults";

// Run migrations before the atoms preload so they read the migrated data.
// Each migration owns its own failure reporting (surfacing through the
// persistence-status store), so they never throw.
await Promise.all([runUserStylingMigration(), runUserLayoutMigration()]);

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
  userVertexStylesAtom,
  userEdgeStylesAtom,
  graphViewLayoutAtom,
  schemaViewLayoutAtom,
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
    reconcileMapByKey,
  ),
  /** All the stored schemas */
  atomWithLocalForage(
    "schema",
    new Map<string, SchemaStorageModel>(),
    reconcileMapByKey,
  ),
  /**
   * User-defined vertex style overrides, keyed by type. The `user-` prefix
   * marks the user-defined layer of the planned `<layer>-<entity>-styles` set
   * (imported, server, base layers land in later work).
   */
  atomWithLocalForage(
    "user-vertex-styles",
    new Map<VertexType, VertexPreferencesStorageModel>(),
    reconcileMapByKey,
  ),
  /** User-defined edge style overrides, keyed by type. See above. */
  atomWithLocalForage(
    "user-edge-styles",
    new Map<EdgeType, EdgePreferencesStorageModel>(),
    reconcileMapByKey,
  ),
  atomWithLocalForage("graph-view-layout", defaultGraphViewLayout),
  atomWithLocalForage("schema-view-layout", defaultSchemaViewLayout),
  /** Stores the graph session data for each connection. */
  atomWithLocalForage<Map<ConfigurationId, GraphSessionStorageModel>>(
    "graph-sessions",
    new Map(),
    reconcileMapByKey,
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
  userVertexStylesAtom,
  userEdgeStylesAtom,
  graphViewLayoutAtom,
  schemaViewLayoutAtom,
  allGraphSessionsAtom,
  showDebugActionsAtom,
  allowLoggingDbQueryAtom,
  defaultNeighborExpansionLimitEnabledAtom,
  defaultNeighborExpansionLimitAtom,
  diagnosticLoggingAtom,
};
