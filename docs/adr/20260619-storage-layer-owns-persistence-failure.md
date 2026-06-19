# ADR — The storage layer owns persistence failure; status lives outside React

- **Status:** Accepted
- **Date:** 2026-06-19
- **Related:** ADR `per-key-diff-merge-cross-tab-reconciliation` (the re-read-merge that occupies the same write-path seam this builds on); ADR `indexeddb-not-localstorage-for-persistence` (the substrate, and source of the error taxonomy). Supersedes the interim per-call-site floating-promise convention (ADR `explicit-floating-promise-convention`). Issue #1854.

## Context

Graph Explorer stores all user data client-side in IndexedDB via `atomWithLocalForage` (`core/StateProvider/atomWithLocalForage.ts`). The write path updates an in-memory Jotai atom synchronously and flushes to IndexedDB in the background. When the durable write **fails**, nothing recovers: in-memory state silently diverges from disk and is lost on reload.

The setter currently returns `Promise<void>`, exposing the background write as interface surface. Each of ~36 call sites must then decide how to handle that promise — an implementation detail (the write is async) leaking into every caller. The interim convention (`logAndNotify`/`logAndIgnore`/`void`) made the leak explicit per site, but the per-site model means each caller re-derives failure handling and message vocabulary the storage layer is better positioned to own.

## Decision

The **storage layer owns the write, so it owns the failure.** Concretely:

1. **The persisted setter returns `void` again.** Failure is handled internally; there is no promise for callers to mishandle. This is a deliberately _deep_ module — a trivial interface (`set(atom, next)`) hiding substantial machinery (queue, retry, taxonomy, merge, status).
2. **Persistence Status is a single, global, three-state model** — `idle | saving | failed` — aggregated across all per-key write queues (any terminal → `failed`; else any in-flight → `saving`; else `idle`). It is **not** per-key: users cannot act on an individual key, so the status names no key. Failure records behind the `failed` state feed a drill-in detail view.
3. **The status store lives outside React/Jotai** — a plain external store (`subscribe`/`getSnapshot`/`emit`). The React edge bridges it with `useSyncExternalStore`. Humanization of raw `{ key, reason, ... }` records (including any engine-specific vocabulary via `useTranslations`) happens only at that React edge.
4. **Failures are classified by a pure `classifyStorageError` function** — `QuotaExceededError` and security/access errors are terminal; everything else (including unknown `error.name`) is retryable up to a cap, then terminal. Retryable-by-default is the safer error: a transient wrongly called terminal loses recoverable data, while a terminal wrongly retried only wastes a few capped backoff cycles.
5. **A per-key write queue** coalesces rapid successive writes, retries transient failures with backoff, and reports outcomes into the status store. Its `flush` body is the only place that touches IndexedDB.

### Internal seams (deep ≠ monolithic)

The depth is hidden behind composition, not crammed into one file: `classifyStorageError` (pure taxonomy) · per-key write queue (coalesce + retry, knows only a `flush` thunk) · the merge-flush (the re-read-diff-write from the cross-tab ADR) · the global status store (write-only from the queue's side). `atomWithLocalForage` composes them.

## Considered Options

- **Storage-layer ownership + global status store (chosen).** Smallest caller-facing interface, single source of truth, React-free core. Collapses the per-site model and the engine-vocabulary-outside-hooks problem (the layer stays raw; React humanizes).
- **Keep the per-call-site `.catch`/`logAndNotify` model.** Rejected: re-derives handling and vocabulary at every site; status is scattered, not a single source of truth.
- **Status as a Jotai atom.** Rejected: every persisted atom would spawn status wiring that must aggregate to one global value, and it would join the fragile top-level-`await` preload dance in `storageAtoms.ts`. A plain store has no mount ordering and is the correct primitive for an external mutable source.
- **Per-key status (name which collection failed).** Rejected: not actionable for the user (the layer retries on their behalf); adds the engine-specific vocabulary burden to the core; the detail view covers the diagnostic need.

## Consequences

- **The ~36 call sites lose their floating-promise handling** — the interim convention is superseded, and that migration is expected to be largely undone. Net caller code shrinks.
- **Tests can no longer await a per-write promise.** They synchronize on a layer-level `waitForPersistenceIdle()` derived from the status store — a better signal that survives coalescing/retry and exercises the production status path.
- **Status is strictly per-tab.** Consistent with the substrate ADR's "no cross-tab sync primitives," a failed write in one tab shows `failed` there regardless of other tabs, and clears only when that tab itself successfully flushes the key. Honest about whose edit is at risk.
- **Recovery is retry + backup prompt, not a write guarantee.** Terminal quota toasts point at the full backup (`saveLocalForageToFile`), which is read-mostly and so remains viable under quota pressure. We do **not** block reload (`beforeunload`).
- **This effort and the cross-tab merge are orthogonal**, meeting only at the `flush` seam — either can ship first without blocking the other.
