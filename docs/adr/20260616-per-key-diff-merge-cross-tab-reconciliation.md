# ADR — Per-key diff-merge reconciliation for shared persisted collections

- **Status:** Accepted
- **Date:** 2026-06-16
- **Related:** ADR `indexeddb-not-localstorage-for-persistence` (IndexedDB constraint) is the storage substrate this reconciliation runs on. Issue #1820 (the clobber bug); inverse of #1788 / per-tab active connection, which wants per-tab _divergence_ rather than reconciliation.

## Context

`atomWithLocalForage` (`core/StateProvider/atomWithLocalForage.ts`) reads each value **once at startup** into an in-memory Jotai atom, then writes the **whole value** back on every change. IndexedDB is shared across same-origin tabs but has no cross-tab synchronization (no BroadcastChannel, no `storage` events, no Web Locks — see ADR `indexeddb-not-localstorage-for-persistence`).

For collections mutated read-modify-write — e.g. `set(atom, prev => [...prev, x])` — a second tab's in-memory `prev` is stale the moment another tab persists. Writing the whole collection back then **silently drops entries the other tab added**. The clobber is last-writer-wins over the _entire_ collection, not just the field a tab touched.

Concrete failure (#1820): Tab A styles **Vertex Type** X and persists. Tab B, opened before that and never having seen X, styles type Y and writes its stale **User Preferences** array — type X's styling is silently lost, discovered only on the next reload. The same hazard hits **Schema** (worst case: async **Schema Sync** completion clobbering a just-added SPARQL prefix), **Connections**, and **Sessions**. Affected: 32 write sites across 7 files.

Scalar atoms (e.g. active connection) are unaffected — each write is a complete intended value, so there is no sibling entry to lose.

## Decision

Reconcile at the **storage layer**, using a **per-key, diff-the-output merge** applied inside the write path. On each persist:

1. **Re-read** the current persisted value from IndexedDB (it may reflect writes by other tabs since this tab loaded).
2. **Diff this tab's output** — compare the value this tab is about to write against this tab's _previous in-memory value_ to determine exactly which keys this tab changed.
3. **Apply only those changed keys** onto the freshly-read value, and persist the result.

The unit of reconciliation is the **key** (collection entry — e.g. one **Vertex Type**'s styling, one **Connection**, one **Schema** entry), so a tab editing entry Y never overwrites entry X that another tab added. The diff is computed from the _resulting_ values, not by replaying the updater function.

### Opt-in seam, not a transparent rewrite

Reconciliation is an **optional `reconcile` parameter on `atomWithLocalForage`**, not separate machinery. An atom opts in by being created with a reconciler function; without one the atom does a blind whole-value write (the parameter selects the flush at creation — a plain `storage.setItem`, or the re-read-merge-write built by `createReconcilingFlush`). This is deliberately **opt-in rather than required** because reconciliation is correct for only a minority of atoms:

- **Map-keyed shared collections reconcile.** The five `Map`-keyed atoms — **Connections** (`configuration`), **Schema**, **User Preferences** (`user-vertex-styles`, `user-edge-styles`, since #1867 split styling into type-keyed maps), and **Sessions** (`graph-sessions`) — all pass the one generic reconciler, `reconcileMapByKey`.
- **Scalars must not.** Layout and the boolean/number settings have no sibling entries to preserve — each write is the whole intended value — so a per-key merge is meaningless for them. (Layout has since moved from shared to per-tab session scope — see ADR `per-tab-session-scoped-storage-primitive` — so it is no longer a shared scalar at all; the boolean/number settings remain the standing examples here.)
- **`activeConfiguration` must not.** It deliberately _diverges_ per tab (the #1788 inverse); reconciling it would reintroduce the very behaviour that decision avoids.

There is also no universal default reconciler: a reconciler must know the value is key-addressable (`reconcileMapByKey` only works on `Map`s). Making reconciliation _required_ would force every scalar atom to pass a nonsensical reconciler, so "required" would in practice still be "choose a reconciler" with worse ergonomics. The cost of opt-in is that a **new** `Map`-keyed shared collection added with plain `atomWithLocalForage` would silently clobber across tabs until someone notices — mitigated by the rule below rather than by flipping the default.

**Rule for new atoms:** a new `Map`-keyed collection shared across tabs must pass `reconcileMapByKey` as `atomWithLocalForage`'s `reconcile` argument. Reach for a bespoke reconciler only for a shape `reconcileMapByKey` cannot serve (e.g. a non-`Map` collection); diff the _resulting_ values, never replay the updater.

### Reference-equality merge

`reconcileMapByKey` decides whether a key changed by **reference** (`Object.is`), not a deep compare: it upserts keys whose value differs by reference from this tab's previous value, drops keys this tab removed, and leaves every other key untouched. This is sound because every write site replaces a whole entry (`new Map(prev).set(id, …)`) rather than mutating one in place, so an unchanged entry keeps its identity and a changed one is a fresh object. The corollary is a contract on callers: **mutating a Map entry in place would be invisible to the merge** and must not be done.

### Scope boundary — durability only

This decision fixes **durability** of concurrent writes to _different_ entries. It deliberately does **not** address:

- **Same-entry conflicts.** Two tabs editing the _same_ key remain **last-writer-wins**. Field-level merge within a single entry is out of scope.
- **Live cross-tab freshness.** A tab still reads its in-memory copy and can show **stale data** while another tab is open. Propagating live changes between open tabs (so both reflect each other's edits without a reload) is explicitly deferred to a separate effort.

## Considered Options

- **Per-key diff-merge re-read at write (chosen).** Smallest change that fixes the clobber for sibling entries; lives entirely in the storage layer behind `atomWithLocalForage`'s `reconcile` parameter, so the many write sites of an opted-in collection are all fixed without touching them. Does not fix stale reads.
- **Replay-the-updater on the re-read value.** Re-run the `prev => next` updater against the freshly-read persisted value instead of diffing outputs. **Rejected: unsafe for non-idempotent updaters** — an updater like "append X" or "increment" applied to an already-updated base double-applies. Diffing the _output_ is update-function-agnostic and safe.
- **Cross-tab live sync (BroadcastChannel / `storage` events).** Keeps in-memory copies live and would also fix stale reads. **Deferred:** larger surface, and freshness is out of scope here. Can be layered on later without contradicting this decision.
- **Web Locks to serialize writes.** Heaviest option, with **availability caveats** across our deploy targets (not guaranteed in all embedding contexts, e.g. some notebook/proxy environments). Rejected for this fix.

## Consequences

- The write path of a reconciling atom becomes **read-modify-write against live IndexedDB** rather than a blind whole-value overwrite, adding one re-read per persist. Acceptable for the mutation frequencies involved (User Preferences is the highest, still human-interaction-paced). Non-reconciling atoms keep the blind write and pay nothing.
- The merge needs each tab's **previous in-memory value** (the last value it persisted) to compute its diff — `createReconcilingFlush` holds this in a closure that advances only once a write lands, so coalesced intermediate writes never shift the baseline.
- Reconciliation is **per key**, so the persisted collections must be key-addressable (objects/maps keyed by entry id or type, or arrays reducible to such). Collections shaped as opaque blobs would not benefit.
- **Same-entry conflicts and stale reads persist by design** — anyone surprised by either should read this ADR's scope boundary before "fixing" it, and the live-sync follow-up is the intended home for the freshness work.
- This is the **inverse** of the per-tab active-connection decision (#1788): those scalars want each tab to _diverge_; these collections are genuinely shared and must _reconcile_. The two ship separately and must not be conflated.
