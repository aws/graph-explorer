import type {
  ConfigurationId,
  RawConfiguration,
} from "../ConfigurationProvider";

import { atomWithLocalForage } from "./atomWithLocalForage";
import {
  defaultUserLayout,
  type GraphSessionStorageModel,
  type SchemaStorageModel,
  type UserStyling,
} from "./index";
import { atomWithLocalForage } from "./atomWithLocalForage";
import { autoLoadBackupIfExists } from "./autoLoadBackup";

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

// Auto-load backup config before initializing atoms
await autoLoadBackupIfExists();

const [
  activeConfigurationAtom,
  configurationAtom,
  schemaAtom,
  userStylingAtom,
  userLayoutAtom,
  allGraphSessionsAtom,
  showDebugActionsAtom,
  allowLoggingDbQueryAtom,
  defaultNeighborExpansionLimitEnabledAtom,
  defaultNeighborExpansionLimitAtom,
] = await Promise.all([
  atomWithLocalForage<ConfigurationId | null>("active-configuration", null),
  atomWithLocalForage<Map<ConfigurationId, RawConfiguration>>(
    "configuration",
    new Map(),
  ),
  /** All the stored schemas */
  atomWithLocalForage("schema", new Map<string, SchemaStorageModel>()),
  atomWithLocalForage<UserStyling>("user-styling", {}),
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
  /** Shows debug actions in various places around the app. */
  atomWithLocalForage<boolean>("allowLoggingDbQuery", false),
  /** Setting that enables/disables the default limit for neighbor expansion. */
  atomWithLocalForage<boolean>("defaultNeighborExpansionLimitEnabled", true),
  /** Setting that defines the default limit for neighbor expansion. */
  atomWithLocalForage<number>("defaultNeighborExpansionLimit", 10),
]);

export {
  activeConfigurationAtom,
  configurationAtom,
  schemaAtom,
  userStylingAtom,
  userLayoutAtom,
  allGraphSessionsAtom,
  showDebugActionsAtom,
  allowLoggingDbQueryAtom,
  defaultNeighborExpansionLimitEnabledAtom,
  defaultNeighborExpansionLimitAtom,
};
