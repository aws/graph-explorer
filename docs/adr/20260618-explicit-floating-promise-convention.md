# ADR — Explicit handling of intentional floating promises

- **Status:** Accepted
- **Date:** 2026-06-18
- **Related:** ADR `per-key-diff-merge-cross-tab-reconciliation` and `indexeddb-not-localstorage-for-persistence` describe the persistence write path whose fire-and-forget nature motivates this convention. Enables the `typescript/no-floating-promises` lint rule.

## Context

Many call sites start a promise and never await it. The most common is a write to a localForage-backed Jotai atom (`atomWithLocalForage`): the in-memory value updates synchronously, while the durable write happens in the background and is "never awaited in production" (see the write-path comment in `core/StateProvider/atomWithLocalForage.ts`). Other cases include react-router `navigate()`, fire-and-forget query refetches, and test-state seeding.

Until now `typescript/no-floating-promises` was off, so these reads as ordinary statements. The hazard: a genuinely-swallowed persistence failure looks identical to an intentional fire-and-forget. The user's hypothesis was that some of those silent `store.set(...)` calls were latent bugs hiding behind that ambiguity.

## Decision

Turn on `typescript/no-floating-promises` (`error`) so every unhandled promise must be **explicitly** marked. Use one of three idioms by meaning:

1. **`.catch(logAndNotify(message, options?))`** (`logAndNotify` from `@/utils`) — builds a `.catch` handler that logs the rejection via `logger.warn` **and** shows the user a warning toast. Use when an unawaited failure is something the **user should know about** — most persisted-atom writes from a user action (saving a connection, editing a style, toggling a setting). Each site passes its own message; query-language vocabulary (node/edge) is resolved with `useTranslations` at the call site so the toast reads correctly per engine (e.g. "resource" for SPARQL). `options` forwards sonner options such as `description`.

2. **`.catch(logAndIgnore)`** (`logAndIgnore` from `@/utils`) — a `.catch` handler that only logs the rejection via `logger.warn`, no toast. Use when a rejection is **meaningful enough to log but not worth interrupting the user** — e.g. a background canvas icon fetch. (Warn, not error: an explicitly-ignored rejection is non-blocking by construction.)

3. **bare `void expr;`** — use when a rejection is **genuinely inert** or already handled elsewhere: aborted `navigate()`, a refetch whose errors surface through query state, a self-catching async helper, and **test-state seeding** (a test seeding store state does not care whether the value lands in durable storage).

Both `logAndNotify` and `logAndIgnore` log at `warn`; they differ only in whether the user is notified. The broader reconciliation contract for persistence errors (reject + per-key merge, per `per-key-diff-merge-cross-tab-reconciliation`) is still a separate effort; `logAndNotify` surfaces the failure but does not yet reconcile or retry the write.

### Alternatives considered

**Centralize the `.catch` inside `atomWithLocalForage` and return `void`.** The writer atom could attach its own `.catch(logAndIgnore)` and return `void`, deleting most of the ~25 `set(...).catch(logAndIgnore)` handlers at call sites. We rejected this for now because the in-flight persistence work (reject + toast, per `per-key-diff-merge-cross-tab-reconciliation`) needs _per-call-site_ control over how a failure is surfaced — a single swallow point in the writer would have to be unwound again to differentiate "log only" from "toast the user." Keeping the decision at each call site also keeps the persisted-write sites **greppable** for the #1854 audit. Once the surfacing contract is settled, collapsing the common case back into the writer is a reasonable follow-up.

## Consequences

- A swallowed persistence error is now either surfaced to the user (`.catch(logAndNotify(...))`), logged (`.catch(logAndIgnore)`), or a deliberate, reviewed `void` — no longer invisible.
- Reviewers have a clear rule: user should know → `logAndNotify`; log-only → `logAndIgnore`; inert → `void`.
- The lint rule prevents silent fire-and-forget from being reintroduced anywhere in the codebase.
