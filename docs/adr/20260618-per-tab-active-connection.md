# Per-tab Active Connection with a persisted breadcrumb

## Status

accepted

## Context

"Active connection" was a single value persisted to shared IndexedDB (the `active-configuration` localForage key, read once at startup with no cross-tab sync), yet the entire app consumed it as if it were per-tab state. Two same-origin tabs therefore could not hold different active connections: whoever wrote last silently changed what the other tab was exploring, and a reload adopted whatever was persisted last. The URL-connect feature (open a connection from a link, in a new tab) made this latent flaw trivially triggerable, but it exists independently on `main`.

We need both: a tab keeps its own active connection regardless of what other tabs do, **and** a returning user's cold start lands on their last connection rather than the connection screen.

## Decision

Split the concept into two roles:

- **Active Connection** — per-tab, held in `sessionStorage`. The value the whole app reads. Survives that tab's reload, dies with the tab. Different tabs are independent.
- **Last Active Connection** — the existing persisted `active-configuration` localForage key, reused unchanged and redefined as a shared, last-writer-wins breadcrumb. Read only as the cold-start seed; never read live.

A fresh tab's Active Connection is seeded with `sessionStorage value ?? persisted breadcrumb value`, resolved before the atom is created (the breadcrumb read is async, in the factory; the atom itself is then created with an already-resolved seed, so there is no post-mount flash or ordering race). On a cold start — no sessionStorage value — the tab does not merely read the breadcrumb, it **claims** it, writing the seeded value into its own sessionStorage. This is the load-bearing property for per-tab stability: a later reload of that tab reads its own value back rather than re-seeding from a breadcrumb another tab may have since overwritten. (Without the claim, two tabs that both cold-started would each re-seed from the shared breadcrumb on every reload, so one tab switching connections would silently change the other on its next reload.)

Writing the per-tab value and the breadcrumb is funneled through the `activeConfigurationAtom` setter (in `activeConnectionStorage.ts`), so every existing `set(activeConfigurationAtom, …)` call site updates both backings with no change. Session-state reset is not part of this atom; each activation call site still pairs the set with `useResetState()` — a known duplication that a single `useActivateConnection` hook could centralize as a clean additive follow-up.

## Considered Options

- **Pure shared global (status quo)** — satisfies restart-persistence, fails multi-tab. The current hazard.
- **Pure per-tab, no breadcrumb** — satisfies multi-tab, fails restart-persistence. Rejected; restart-persistence is a product requirement.
- **Per-tab + breadcrumb (chosen)** — satisfies both. Persistence demoted to a cold-start hint; liveness is per-tab.
- **Primary-tab election for breadcrumb writes (BroadcastChannel / Web Locks)** — would make cold start resume a chosen tab rather than the most-recent activation. Rejected: reintroduces the cross-tab coordination this design avoids, to refine a hint rather than fix a correctness property. Last-writer-wins is accepted instead; election remains a clean additive follow-up if it ever bites.

## Consequences

- **No migration.** Returning users' existing `active-configuration` value is the breadcrumb already; a fresh tab with empty sessionStorage seeds from it and lands on the last connection.
- **Deleted-connection degrades safely with no new guard.** `activeConfigSelector` was hardened here to coalesce a map miss to `null` (it previously returned `undefined`), so a tab holding a now-deleted id resolves to the connection screen on its next reload. Covered by a regression test, not runtime logic.
- **Cold start can resume a connection activated in a _different_ tab** (last-writer-wins breadcrumb). Accepted as honest "resume the most recent activation" semantics; only observable after all tabs close.
- The sessionStorage backing is injectable so two-tab isolation can be tested directly with two Jotai stores over one shared mock localForage and separate sessionStorage mocks.
