# ADR — IndexedDB (via localForage), not localStorage, for client-side persistence

- **Status:** Accepted
- **Date:** 2026-06-16
- **Related:** ADR `per-key-diff-merge-cross-tab-reconciliation` builds the cross-tab fix on top of this constraint. Issue #1820.

## Context

Graph Explorer stores all user data client-side — there is no server-side storage. The persisted collections are **User Preferences**, **Schema**, **Connections**, and **Sessions**, all routed through `atomWithLocalForage` (`core/StateProvider/atomWithLocalForage.ts`), which is backed by localForage. localForage is configured (`name: "ge"`, `storeName: "graph-explorer"`) to use IndexedDB as its driver.

Two of these payloads are routinely large:

- A **Session** holds every **Vertex** and **Edge** a user has loaded through exploration for a **Connection**. Active exploration accumulates thousands of entities with their **Properties**.
- A **Schema** holds every discovered **Vertex Type**, **Edge Type**, and **Edge Connection** with their attributes, produced by **Schema Sync** against the connected database.

Both regularly exceed `localStorage`'s ~5MB per-origin quota. `localStorage` is also synchronous and string-only (it would force `JSON.stringify`/`parse` of the whole payload on the main thread for every read and write).

This constraint is **invisible in the code.** Nothing at the `atomWithLocalForage` call sites signals "these values are too big for `localStorage`." A reader who sees a simple read-once / write-whole-value atom could reasonably "simplify" it to `localStorage`, or reach for a `localStorage`-based collection library, and it would appear to work in development against small datasets — then silently fail in production when a real Session or Schema blows the quota.

## Decision

Persistence stays on **IndexedDB via localForage.** `localStorage` (and any library built on it) is explicitly ruled out for these collections.

Rationale, recorded so it is not re-litigated:

- **Capacity.** Session and Schema payloads exceed `localStorage`'s ~5MB limit; IndexedDB has no comparable practical ceiling for our payload sizes.
- **Asynchronous, structured storage.** IndexedDB stores structured values off the main thread; `localStorage` is synchronous and string-only.
- **The simplification is a trap, not a win.** A `localStorage`-backed `LocalStorageCollection`-style abstraction looks cleaner but cannot hold the data. Any persistence library evaluated for this codebase must use an IndexedDB driver (or equivalent large-capacity store), not `localStorage`.

## Consequences

- The persistence layer is inherently **asynchronous**. `atomWithLocalForage` preloads each value before returning the atom so reads are synchronous thereafter, but writes flush to IndexedDB in the background. The cross-tab fix in ADR `per-key-diff-merge-cross-tab-reconciliation` has to live inside that async write path.
- IndexedDB is **shared across all same-origin tabs** but has **no built-in cross-tab synchronization**. That sharing is precisely what makes the concurrent-write clobber in #1820 possible, and what ADR `per-key-diff-merge-cross-tab-reconciliation` reconciles.
- Tests run localForage unmocked against `fake-indexeddb` (a fresh `IDBFactory` per test, see `setupTests.ts`), so the persistence layer is exercised against real IndexedDB semantics rather than a stub. This is what lets the #1820 cross-tab clobber be reproduced in a test.

## Out of scope

- The choice of localForage as the IndexedDB wrapper (vs. raw IndexedDB or another wrapper) is not revisited here — only the IndexedDB-class storage requirement is. Swapping wrappers is allowed as long as the replacement keeps large-capacity, asynchronous, structured storage.
