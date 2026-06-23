# ADR — Type-keyed Map atoms for User Preferences storage

- **Status:** Accepted
- **Date:** 2026-06-23
- **Related:** ADR `per-key-diff-merge-cross-tab-reconciliation` — the Map-keyed shape is the prerequisite for per-type merge. ADR `storage-layer-owns-persistence-failure` — the migration's "catch and degrade to defaults on failure" posture follows that ADR's established startup-failure stance. Issue #1864 (this change). Issues #1820 / #1831 (cross-tab merge, separate follow-up).

## Context

User Preferences (vertex and edge display customizations) were previously persisted under a single `"user-styling"` key in IndexedDB as a `LegacyUserStylingStorageModel` object:

```ts
type LegacyUserStylingStorageModel = {
  vertices?: VertexPreferencesStorageModel[];
  edges?: EdgePreferencesStorageModel[];
};
```

This shape had three problems:

**1. Linear-scan reads.** Every consumer that needed preferences for a specific type had to rebuild a `Map` from the array on each atom read — `toMapByType(userStyling.vertices)`, etc. The `vertexPreferencesAtom` and `edgePreferencesAtom` both did this on every access.

**2. Array-splice writes.** Setting or resetting a style required `findIndex` + `splice` or `filter` to avoid duplicates — O(n) operations that also produced a new array reference on every write, causing wider re-renders than necessary.

**3. Not composable with per-type merge.** The planned cross-tab reconciliation fix (ADR `per-key-diff-merge-cross-tab-reconciliation`, issue #1831) requires merging on a per-type basis. A flat array with no key identity makes that merge ambiguous — you cannot tell whether two arrays from different tabs are disjoint (should union) or overlapping (should prefer newer).

The three other major persisted collections — `configurationAtom`, `schemaAtom`, and `allGraphSessionsAtom` — already use Maps as their storage shape, so the new shape is consistent with the rest of the persistence layer.

## Decision

User Preferences are stored as two separate type-keyed Maps:

```ts
userVertexStylesAtom: Map<VertexType, VertexPreferencesStorageModel>; // key: "user-vertex-styles"
userEdgeStylesAtom: Map<EdgeType, EdgePreferencesStorageModel>; // key: "user-edge-styles"
```

Splitting vertex styles from edge styles (rather than a single `Map<string, ...>`) keeps the types precise and avoids a heterogeneous map that mixes `VertexPreferencesStorageModel` and `EdgePreferencesStorageModel` values under untyped string keys.

The keys follow a `<layer>-<entity>-styles` convention. Only the user-defined layer (`user-`) exists today; planned later work adds imported (UI file import), server (fetched from server config), and base (hard-coded codebase defaults) layers, which merge by precedence to produce the final rendering. Naming the user layer `user-vertex-styles` now — rather than a bare `vertex-styles` — means those sibling keys slot in without renaming or re-migrating this one.

Maps persist natively through localForage/IndexedDB via the structured-clone algorithm — no serialization work is needed.

### Migration

Existing data under `"user-styling"` is converted on first startup by `migrateUserStylingIfNeeded` (`core/StateProvider/migrateUserStyling.ts`):

- **Idempotent:** skips migration when both `"user-vertex-styles"` and `"user-edge-styles"` are already present in IndexedDB.
- **Partial-write recovery without clobbering:** writes only the key(s) still missing. A crash between the two `setItem` calls re-runs the migration on the next load and fills only the absent half. Because the legacy `"user-styling"` snapshot is never updated after migration, re-deriving an already-present key from it would discard edits the user made after the first migration — so a surviving key is left untouched.
- **Non-destructive:** the old `"user-styling"` key is left in place as a rollback escape hatch. Deleting it is a separate follow-up once confidence in the migration is established.
- **Duplicate collapse:** if the old array contains duplicate type entries (data integrity issue in old storage), the last entry wins and a console warning is emitted listing the dropped type.
- **User-visible on failure:** the migration runs at module load (a top-level `await` in `storageAtoms.ts`), before React mounts. A thrown failure is caught — the legacy data is preserved on disk and the migration retries on the next reload — and recorded in a module-level flag that `useReportUserStylingMigrationFailure` surfaces as a non-blocking toast once the UI is up, so missing customizations are explained rather than appearing as silent data loss.

### Old type

`LegacyUserStylingStorageModel` remains exported from `userPreferences.ts` — marked `@deprecated` — solely for use in the migration and its tests. It must not be used in new code.

## Consequences

- **O(1) reads and writes.** `vertexPreferencesAtom` and `edgePreferencesAtom` look up directly with `map.get(type)`. `useVertexStyling`/`useEdgeStyling` write with `new Map(prev).set(type, ...)` or `.delete(type)`.
- **`toMapByType` deleted.** The `configuration.ts` helper that rebuilt a map from the old array on every merge is gone; `mergeConfiguration` now accepts the two Maps directly.
- **Foundation for cross-tab merge.** Map keying by type is the prerequisite for the per-type merge-on-write fix in #1831. Each type is an independent unit that can be merged without conflict resolution across tabs.
- **Breaking change on storage shape.** Any external code that reads `"user-styling"` from the same IndexedDB store will see the old array shape (still present) plus new Map-shaped keys. The migration runs once on startup and is transparent to the application.
