# Per-tab session-scoped storage as a reusable primitive

## Status

accepted

## Context

The per-tab Active Connection decision (`per-tab-active-connection`) solved one concept by hand: hold the live value in `sessionStorage`, keep the existing localForage key as a shared last-writer-wins breadcrumb, and **claim** the breadcrumb into `sessionStorage` on cold start so a reload reads the tab's own value back. That logic lived inline in `activeConnectionStorage.ts`.

Graph-view and schema-view layout (active sidebar tab, sidebar width, view toggles, the details-auto-open preference) had the same shape of problem as Active Connection, not the shape the reconciliation ADR addresses. Layout is a property of **what this tab is looking at**, not a global user preference: two tabs exploring different connections each want their own sidebar and toggle state. As shared `atomWithLocalForage` scalars they were last-writer-wins across tabs — a second tab's layout silently became the first tab's on its next cold start. Reconciliation (`per-key-diff-merge`) is the wrong tool: layout has no sibling entries to preserve, so a per-key merge is meaningless; what it wants is per-tab **divergence**, exactly like Active Connection.

That made three distinct cross-tab storage behaviors in the codebase, only two of them named, and the third (per-tab) implemented once as a one-off. Adding a second and third per-tab concept by copy-pasting the subtle seed-and-claim logic was the wrong move.

## Decision

Extract the per-tab + breadcrumb mechanism into one primitive, `createSessionScopedAtom<T>` (`core/StateProvider/sessionScopedStorage.ts`), and route every per-tab concept through it. There are now **three named cross-tab storage scopes**, each a deliberate choice at the atom's creation:

- **Per-tab** — `createSessionScopedAtom`. Live value in `sessionStorage`; shared localForage breadcrumb read once as the cold-start seed and claimed into `sessionStorage`. Tabs diverge. Backs Active Connection, graph-view layout, schema-view layout.
- **Shared-reconciled** — `atomWithLocalForage` with `reconcileMapByKey`. Map-keyed collections genuinely shared across tabs, merged per key (`per-key-diff-merge`). Backs Connections, Schema, User Preferences, Sessions.
- **Shared-blind-write** — `atomWithLocalForage` with no reconciler. Scalars where each write is the whole intended value and tabs need not diverge. Backs the boolean/number settings (e.g. `showDebugActions`).

`createActiveConfigurationAtom` is refactored onto the primitive rather than left as a parallel implementation, so the seed-and-claim logic lives in exactly one place with one set of tests.

A per-tab value crosses two backings with different serialization needs, so the primitive takes a **`SessionValueCodec<T>`**: the breadcrumb keeps the native value (structured clone preserves a `Set`), while `sessionStorage` holds only strings. The codec's `deserialize` validates the parsed string with **zod** and returns `null` for a missing, unparseable, or wrong-shape value, so a stale or hand-edited per-tab value falls through to the breadcrumb instead of seeding a bad shape. Graph-view layout's codec serializes its `activeToggles` `Set` as an array and rebuilds it on read via a zod `.transform`; schema-view layout is plain JSON. Active Connection's value is a bare id string, so its codec passes the string through and skips zod.

## Considered Options

- **Copy the seed-and-claim logic into each layout atom.** Rejected: duplicates the load-bearing, easy-to-get-subtly-wrong claim logic across three atoms, with three sets of near-identical tests.
- **Leave layout as shared (status quo).** Rejected: the clobber that motivated the per-tab Active Connection decision applies to layout for the same reason.
- **Reconcile layout per key (`atomWithLocalForage` + a reconciler).** Rejected: layout has no sibling entries; it wants per-tab divergence, not a merge. Reconciling it would reintroduce cross-tab coupling.
- **Per-tab + breadcrumb extracted to a primitive (chosen).** Names the third scope, removes the duplication, and unifies Active Connection onto it.

## Consequences

- **No migration.** The breadcrumb keeps each concept's existing localForage key and native shape; the codec only governs the per-tab `sessionStorage` round-trip. Existing stored layouts seed a fresh tab unchanged.
- **Cold start can resume a layout set in a different tab** (last-writer-wins breadcrumb), the same honest "resume the most recent" semantics Active Connection accepts. Per the storage model — read once at creation, never re-read (`per-key-diff-merge` context) — no scope here has ever had live cross-tab sync; an already-open tab does not reflect another tab's change until it reloads.
- **A corrupt or stale per-tab value self-heals.** `deserialize` returning `null` falls through to the breadcrumb then the default; breadcrumb **write** failures still surface through the persistence-status path (`storage-layer-owns-persistence-failure`). Appropriate for non-critical view preferences.
- **Rule for new atoms.** A concept that should diverge per tab uses `createSessionScopedAtom` with a codec; a shared Map-keyed collection uses `reconcileMapByKey` (`per-key-diff-merge`); a shared scalar uses plain `atomWithLocalForage`. Scope is now a visible choice at the atom's creation, not an implicit consequence of which factory was reached for.
- The `sessionStorage` backing stays injectable, so per-tab isolation is tested directly with separate stores and separate `sessionStorage` mocks over one shared mock localForage.
- This primitive is the `perTab` adapter that spike #1876 proposes to formalize alongside the other two scopes. This ADR records the **scope** decision; #1876 may later relocate where the logic lives without re-deciding it.
