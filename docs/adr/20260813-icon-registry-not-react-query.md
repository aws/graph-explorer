# ADR — Resolve vertex icons in a registry, not TanStack Query

- **Status:** Accepted
- **Date:** 2026-08-13
- **Related:** PR #2102; issues #2091, #2103, #2105, #2107. Supersedes the icon-resolution decisions in PR #1777. Affects `core/icons/`, `components/VertexSymbol/`.

## Context

Every vertex type carries an icon, drawn on two surfaces: the cytoscape canvas needs a self-contained `background-image` string, and React components draw the same icon in the DOM. An icon is a bundled Lucide reference (`lucide:<name>`), a user-supplied SVG, or a raster url.

Resolution used TanStack Query because it was the project's async-state tool. That failed hard at scale: `useBackgroundImageMap` called `useQuery` once per vertex type, so ~10k types created ~10k observers, notification cost O(n²), and the schema view locked up for ~19s — all of it inside `@tanstack/react-query`, none in cytoscape.

The cache was a poor fit rather than mis-tuned:

- Every icon query set `staleTime: Infinity`. Icons are immutable, identity-addressable, bounded (dozens of unique icons even at 10k types), and never invalidate. Nothing in the requirement refetches, mutates, paginates, or refreshes.
- Only one of the three kinds does real I/O. A raster url goes straight to the browser, and a Lucide reference is an `import()` that the ES module map already caches and in-flight dedupes. Only remote SVG needs fetch, dedup, and caching.

So the machinery went unused while its per-hook subscription model — the one part that did apply — scaled with vertex types and broke.

Separately, the DOM surface paid for a workaround it did not need. `VertexSymbol` drew the icon as `<image href="data:image/svg+xml,…">`, a **separate document** that CSS cannot reach, so the vertex color had to be baked into the markup asynchronously. `VertexIcon` already rendered Lucide with `style={{ color }}` and got inheritance for free.

## Decision

**1. An icon registry replaces TanStack Query for icon resolution.**

`core/icons/iconRegistry.ts` is a module-level store keyed by `IconSourceId` — an icon's identity, independent of the color any vertex type draws it in. React reads it through `useSyncExternalStore`, so `useResolvedIcons` holds one subscription regardless of how many vertex types it covers: the fan-out is unrepresentable rather than merely tuned down. (`useResolvedIcon`, for a single icon, is one subscription per rendered icon — bounded by the screen, not by schema size.)

`request()` is idempotent, which is where in-flight dedup comes from. Color is never part of the key; applying it is a pure transform (`toIconImageUrl`) that consumers run per render, deduped by `(icon, color)`.

**A failed resolution is never cached, but retries stop after three attempts.** Caching the failure would reproduce PR #1777's finding R6 — a hand-rolled `iconCache` that permanently retained transient errors — while leaving retries uncapped would re-fetch a permanently broken icon on every render. The cap counts every failure, not just thrown ones: `fetch` does not reject on 404, so that case arrives as a body that is not SVG.

**2. Icons render per kind, on the surface's own terms.**

| kind     | canvas         | DOM                                        |
| -------- | -------------- | ------------------------------------------ |
| Lucide   | baked data uri | `<DynamicIcon>`, live DOM, color inherited |
| user SVG | baked data uri | `<image href="data:…">`, color baked       |
| raster   | url            | `<image href>`                             |

Lucide markup is trusted bundled geometry with no ids, defs, or script, so inlining it costs nothing and recoloring becomes synchronous.

Untrusted SVG is deliberately **not** inlined on these surfaces. `<image href="data:…">` renders it as a script-disabled image document (W3C SVG Integration §3.4/§3.6 — an image context disables both script execution and external references). Inlining would trade that browser-enforced boundary for DOMPurify alone, and add id collisions with the `useId()`-generated `clipPath` ids and unsanitized `<style>` blocks. DOMPurify stays; the sandbox stays with it. The cost is that hardcoded fills in custom SVG still do not follow the vertex color (#2105, pre-existing).

This is not codebase-wide: `components/VertexIcon.tsx` inlines sanitized user SVG into the live DOM via `react-inlinesvg`, with no sandbox. It predates this decision and is the outlier, not the pattern to copy.

**3. `clip-path` goes on an ancestor `<g>`, never on the nested `<svg>`.**

Chrome renders **nothing** when `clip-path` sits directly on a nested `<svg>`, and nothing about layout or color reveals the fault — the path still reports a correct bounding box and inherited stroke. Since only real pixels expose it, `VertexSymbol.test.tsx` guards the structure instead. The failure mode is a silently invisible icon.

## Considered Options

- **Icon registry + `useSyncExternalStore` (chosen).** One subscription per component, no cache keys to design, cross-surface sharing as the only possible behavior, and tests need no provider. Costs: hand-written retry with no backoff, no devtools, and a documented deviation from the project's TanStack Query convention.
- **`useQueries` keyed per unique icon.** Restores sharing and keeps observers to dozens, but is strictly more machinery than a Map for a problem with no server-state semantics. Note PR #1777's base already used `useQueries` — keyed per vertex type, which is how the lockup shipped.
- **One batched query over the whole icon set.** Fixes the observer count only. A set-shaped key re-resolves every icon when one type changes, and splits the cache namespace from the DOM surface.
- **Inline untrusted SVG for CSS inheritance.** Loses the image-document sandbox and needs id namespacing, and `dangerouslySetInnerHTML` invites scanner findings, for a cosmetic gain.

## Consequences

- **Icons are the documented exception to "async state goes in TanStack Query."** New icon work belongs in the registry; anything with server-state semantics still belongs in TanStack Query. This is not a precedent for replacing it elsewhere.
- Resolution no longer scales with vertex-type count. Both surfaces share one resolution per unique **fetched** icon; Lucide relies on the ES module cache instead, because the DOM path renders through `DynamicIcon` and never asks the registry.
- Retry is weaker than the TanStack Query default it replaces — three attempts back to back, versus four with exponential backoff — so the cap limits wasted work rather than riding out a flaky endpoint.
- The registry is a **module singleton on purpose**: an icon cache is process-global, and two components resolving the same icon sharing one resolution is the property this change exists to restore. Scoping it per render tree or per Jotai store would serve only test isolation, while making it possible for the app to hold two caches. Isolation instead comes from a central `reset()` in `setupTests.ts`, so no individual test carries that responsibility.
- `react-dom/server` is still in the client bundle, because `getLucideSvgString` uses `renderToStaticMarkup` for the canvas string. Removing it reverses PR #1777's finding R7 and needs its own review — tracked in #2107.
