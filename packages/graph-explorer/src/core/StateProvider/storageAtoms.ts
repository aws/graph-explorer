import type { ConnectionId, SavedConnection } from "@/connections";

// Deep import: the `@/connections` barrel re-exports modules that import
// this file, so importing the transform through it forms a cycle in which
// `transformSavedConnections` is still undefined when the `configuration`
// atom below is defined.
// oxlint-disable-next-line no-restricted-imports
import { transformSavedConnections } from "@/connections/legacyConnection";

import type { EdgeType, VertexType } from "../entities";
import type { GraphSessionStorageModel } from "./graphSession/storage";
import type { EdgeStyleStorage, VertexStyleStorage } from "./graphStyles";
import type { SchemaStorageModel } from "./schema";

import { createActiveConnectionIdAtom } from "./activeConnectionStorage";
import { atomWithLocalForage, reconcileMapByKey } from "./atomWithLocalForage";
import {
  defaultGraphViewLayout,
  graphViewLayoutCodec,
} from "./graphViewLayoutDefaults";
import { runUserLayoutMigration } from "./migrateUserLayout";
import { runUserStylingMigration } from "./migrateUserStyling";
import { loadPersistedAtoms } from "./persistedAtomRegistry";
import {
  defaultSchemaViewLayout,
  schemaViewLayoutCodec,
} from "./schemaViewLayoutDefaults";
import { createSessionScopedAtom } from "./sessionScopedStorage";
import { transformVertexStyles } from "./vertexStylesTransform";

/**
 * The persisted atoms: Jotai atoms whose values live in IndexedDB (via
 * localForage) or, for per-tab state, in sessionStorage.
 *
 * Each atom is defined synchronously and holds no value until
 * `loadPersistedState()` loads it. The app awaits that once before its first
 * render, so reads and writes stay synchronous and no component ever sees a
 * default before the stored value. Every persisted atom is defined here so
 * one call loads them all, in parallel. See ADR
 * `explicit-persisted-state-bootstrap`.
 */

/**
 * Loads every persisted atom from storage. The app awaits this once, before it
 * renders, so no component ever sees a default before the stored value.
 *
 * Migrations run first so the atoms read the migrated data. Each migration
 * owns its own failure reporting (surfacing through the persistence-status
 * store), so they never throw.
 */
export async function loadPersistedState(): Promise<void> {
  await Promise.all([runUserStylingMigration(), runUserLayoutMigration()]);
  await loadPersistedAtoms();
}

export const activeConnectionIdAtom = createActiveConnectionIdAtom();

export const savedConnectionsAtom = atomWithLocalForage<
  Map<ConnectionId, SavedConnection>
>("configuration", new Map(), {
  reconcile: reconcileMapByKey,
  transform: transformSavedConnections,
});

/** All the stored schemas */
export const schemaAtom = atomWithLocalForage(
  "schema",
  new Map<string, SchemaStorageModel>(),
  { reconcile: reconcileMapByKey },
);

/** User-defined vertex style overrides, keyed by type. */
export const userVertexStylesAtom = atomWithLocalForage(
  "user-vertex-styles",
  new Map<VertexType, VertexStyleStorage>(),
  { reconcile: reconcileMapByKey, transform: transformVertexStyles },
);

/** User-defined edge style overrides, keyed by type. */
export const userEdgeStylesAtom = atomWithLocalForage(
  "user-edge-styles",
  new Map<EdgeType, EdgeStyleStorage>(),
  { reconcile: reconcileMapByKey },
);

// View Layout is per-tab: each tab keeps its own sidebar/toggle state in
// sessionStorage, with a shared localForage breadcrumb seeding a fresh tab.
export const graphViewLayoutAtom = createSessionScopedAtom({
  key: "graph-view-layout",
  defaultValue: defaultGraphViewLayout,
  codec: graphViewLayoutCodec,
});

export const schemaViewLayoutAtom = createSessionScopedAtom({
  key: "schema-view-layout",
  defaultValue: defaultSchemaViewLayout,
  codec: schemaViewLayoutCodec,
});

/** Stores the graph session data for each connection. */
export const allGraphSessionsAtom = atomWithLocalForage<
  Map<ConnectionId, GraphSessionStorageModel>
>("graph-sessions", new Map(), { reconcile: reconcileMapByKey });

/*
 * General App Settings
 */

/** Shows debug actions in various places around the app. */
export const showDebugActionsAtom = atomWithLocalForage<boolean>(
  "showDebugActions",
  false,
);

/** Enables logging of generated database queries on the proxy server. */
export const allowLoggingDbQueryAtom = atomWithLocalForage<boolean>(
  "allowLoggingDbQuery",
  false,
);

/** Setting that enables/disables the default limit for neighbor expansion. */
export const defaultNeighborExpansionLimitEnabledAtom =
  atomWithLocalForage<boolean>("defaultNeighborExpansionLimitEnabled", true);

/** Setting that defines the default limit for neighbor expansion. */
export const defaultNeighborExpansionLimitAtom = atomWithLocalForage<number>(
  "defaultNeighborExpansionLimit",
  10,
);

/** Enables verbose diagnostic logging to the browser console. */
export const diagnosticLoggingAtom = atomWithLocalForage<boolean>(
  "diagnosticLogging",
  false,
);
