# ADR — Explicit handling of intentional floating promises

- **Status:** Accepted
- **Date:** 2026-06-18
- **Related:** ADR `per-key-diff-merge-cross-tab-reconciliation` and `indexeddb-not-localstorage-for-persistence` describe the persistence write path whose fire-and-forget nature motivates this convention. Enables the `typescript/no-floating-promises` lint rule.

## Context

Many call sites start a promise and never await it. The most common is a write to a localForage-backed Jotai atom (`atomWithLocalForage`): the in-memory value updates synchronously, while the durable write happens in the background and is "never awaited in production" (see the write-path comment in `core/StateProvider/atomWithLocalForage.ts`). Other cases include react-router `navigate()`, fire-and-forget query refetches, and test-state seeding.

Until now `typescript/no-floating-promises` was off, so these reads as ordinary statements. The hazard: a genuinely-swallowed persistence failure looks identical to an intentional fire-and-forget. The user's hypothesis was that some of those silent `store.set(...)` calls were latent bugs hiding behind that ambiguity.

## Decision

Turn on `typescript/no-floating-promises` (`error`) so every unhandled promise must be **explicitly** marked. Use one of two idioms by meaning:

1. **`fireAndForget(promise)`** (`@/utils`) — attaches a `.catch` that logs the rejection via `logger.warn` (warn, not error: an explicitly-ignored rejection is non-blocking by construction — the in-memory state already updated and nothing downstream awaits it). Use when a rejection is **meaningful and should be observed** even though the caller does not await it. This is the idiom for **persisted-atom setters**: a failed durable write gets logged rather than silently dropped, and the call sites stay greppable for follow-up auditing.

2. **bare `void expr;`** — use when a rejection is **genuinely inert** or already handled elsewhere: aborted `navigate()`, a refetch whose errors surface through query state, a self-catching async helper, and **test-state seeding** (a test seeding store state does not care whether the value lands in durable storage).

The reconciliation contract for user-facing persistence errors (reject + surface a toast) is a **separate, in-flight effort** on the persistence branch. This ADR deliberately does **not** change the runtime behavior of persisted setters — it only makes the existing fire-and-forget explicit. When the toast contract lands, the `fireAndForget`-wrapped userStyling call sites are the ones to revisit toward a handled-reject form.

### Alternatives considered

**Centralize the `.catch` inside `atomWithLocalForage` and return `void`.** The writer atom could attach its own `.catch(logger.error)` and return `void`, deleting most of the ~25 `fireAndForget(set(...))` wrappers at call sites. We rejected this for now because the in-flight persistence work (reject + toast, per `per-key-diff-merge-cross-tab-reconciliation`) needs _per-call-site_ control over how a failure is surfaced — a single swallow point in the writer would have to be unwound again to differentiate "log only" from "toast the user." Keeping the decision at each call site also keeps the persisted-write sites **greppable** for the #1854 audit. Once the surfacing contract is settled, collapsing the common case back into the writer is a reasonable follow-up.

## Consequences

- A swallowed persistence error is now either logged (`fireAndForget`) or a deliberate, reviewed `void` — no longer invisible.
- Reviewers have a clear rule: meaningful-but-unawaited → `fireAndForget`; inert → `void`.
- The lint rule prevents silent fire-and-forget from being reintroduced anywhere in the codebase.
