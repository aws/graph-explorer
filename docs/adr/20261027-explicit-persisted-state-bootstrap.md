# ADR — Load persisted state in an explicit bootstrap, not at import

- **Status:** Accepted
- **Date:** 2026-10-27
- **Related:** ADRs `per-key-diff-merge-cross-tab-reconciliation`, `per-tab-session-scoped-storage-primitive`, `read-time-transform-for-persisted-values`, `type-keyed-map-atoms-for-user-preferences` and `storage-layer-owns-persistence-failure` (the persisted-atom behavior this keeps unchanged).

## Context

`storageAtoms.ts` created every persisted atom with a top-level `await`: the startup migrations ran, then each atom loaded from IndexedDB while the module evaluated. Every module that imported it waited on IndexedDB, and no persisted atom could be referenced synchronously, which is why a separate file of key constants existed. Tests had to reset the module registry to reload the atoms.

The reason for preloading still holds. Jotai's `onMount` preload replaces the default with the stored value after an async read, so the app renders with the default first and races with early interactions. Making every interaction async spreads through the whole app.

## Decision

Define the atoms synchronously and load them in one explicit step before the first render.

- Each persisted atom is an `export const` built with `atomWithLocalForage`, `createSessionScopedAtom` or `createActiveConnectionIdAtom`, and carries its `storageKey`.
- These functions register the atom. Only `storageAtoms.ts` defines app-wide atoms, so `loadPersistedState()` sees all of them.
- `loadPersistedState()` runs the startup migrations, then loads every registered atom in parallel. `startApp` awaits it before the first render, so no component sees a default before the stored value.
- Reading or writing a persisted atom before it loads throws, rather than returning a default.
- `setupTests.ts` seeds every persisted atom with its default before each test. A test that seeds storage calls `loadPersistedState()`, or a `preloadSavedConnection*` helper, to read the stored values.
- A test that needs one atom loaded on its own, such as a second tab, calls `loadPersistedAtom()`.

## Considered Options

- **Keep the top-level await.** Every importer waits on IndexedDB, and atoms cannot be referenced synchronously.
- **Jotai `onMount` or async `atomWithStorage`.** The default flashes before the stored value arrives, and early interactions race the load.
- **Suspense with async atoms.** Async spreads through every reader of persisted state.
- **Explicit bootstrap (chosen).** Reads and writes stay synchronous, and the load happens once before render.

## Consequences

- A new persisted atom is defined in `storageAtoms.ts` with one of these creators, so it always registers before `loadPersistedState()` runs. An atom in a module imported after the load throws on first read.
- A read before the load fails loudly instead of returning a default.
- The entry module (`index.tsx`) is the only top-level await, because nothing imports it.
- A failed load (IndexedDB unavailable or blocked) renders an error page about the browser's saved data instead of the app, rather than leaving the page blank.
