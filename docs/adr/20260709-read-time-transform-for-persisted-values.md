# ADR — Read-time transform for intra-key persisted value changes

- **Status:** Accepted
- **Date:** 2026-07-09
- **Related:** ADR `storage-layer-owns-persistence-failure` (the write path and failure model this stays out of); startup key-copy migrations `runUserLayoutMigration` / `runUserStylingMigration` in `storageAtoms.ts` (the sibling mechanism this delimits). Issue #1902.

## Context

Persisted state in IndexedDB (via `atomWithLocalForage`) reloads in its stored shape after a type changes. Issue #1902 retired an enum member — the `activeSidebarItem` values `"nodes-styling"` / `"edges-styling"` collapsed into `"styles"` — a one-to-one legacy→current **value** substitution under the same key. That is neither a key rename (which the startup migrations handle) nor something every consumer of `activeSidebarItem` should have to know about.

## Decision

Reshape the value **on read**, via a `transform` option on `atomWithLocalForage`: `transform: (loaded: T) => T` runs on the preloaded value before it seeds the atom. The transform lives beside its type (`transformGraphViewLayout` / `transformSchemaViewLayout`, sharing `transformLegacySidebarItem`) and is wired onto the atom in `storageAtoms.ts`.

Two decisions here are not obvious from the code:

1. **No write-back.** The corrected value lives in memory; the stale value stays in storage until an unrelated write rewrites the key. This is fine because the transform is pure and total, so re-running it every load is free — convergence buys nothing. It is also why the transform must never throw or do I/O: it seeds atom init with no failure channel.
2. **A transform is not a migration.** A migration rewrites what is persisted and reports failure; a transform is a pure read-time reshape that never touches storage. The boundary for future changes: **cross-key rename/move → startup migration** in `storageAtoms.ts`; **intra-key value normalization → read-time transform**.

## Considered Options

- **Read-time transform, no write-back (chosen).** Centralized, invisible to consumers, no startup dance.
- **Transform that writes back once.** Self-heals storage, but gives the transform a write side effect and the failure-handling the pure/total contract exists to avoid — for cosmetic storage tidiness.
- **A third startup migration (`runSidebarItemMigration`).** Over-engineered: a full failure-reporting, escape-hatch migration to run a `Set.has`.
- **Tolerate the legacy values in the sidebar hooks.** Leaks the retired values into every reader of `activeSidebarItem`.

## Consequences

- New persisted-value changes reshape on read; new key moves keep using startup migrations.
- The transform is a purity trap if misused — a future transform that throws or does I/O breaks startup.
- `atomWithLocalForage`'s third argument became an options object `{ reconcile?, transform? }` (was a positional `reconcile`); mechanical update across its call sites and the `openPersistenceTab` test helper.
