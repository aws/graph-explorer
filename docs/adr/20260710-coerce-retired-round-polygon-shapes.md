# ADR — Coerce retired round-polygon shapes at read boundaries

- **Status:** Accepted
- **Date:** 2026-07-10
- **Related:** ADR `read-time-transform-for-persisted-values` (the mechanism); issue #1922 (the defect); PR #1886 (exposed the shapes in the picker). Cytoscape 3.34.0 is the latest published version.

## Context

Cytoscape's round-polygon canvas renderer degenerates at 24px (our node size) for six shapes: `round-triangle`, `round-pentagon`, `round-hexagon`, `round-heptagon`, `round-octagon`, `round-tag`. The corner computation collapses, rendering each as a formless blob and producing invalid edge-endpoint coordinates that cause connected edges to disappear. `round-rectangle` and `round-diamond` are unaffected (they use a different code path). No upstream fix exists; the one related issue (cytoscape/cytoscape.js#3282) describes a crash, not this visual collapse.

The shapes became selectable in the UI via #1886, so users may have stored them in IndexedDB (user-vertex-styles, shared-vertex-styles) or in exported styling files. We must handle that existing data.

## Decision

Keep the six values in `SHAPE_STYLES` and `ShapeStyle` so older styling files still pass Zod validation on import. Remove them from the picker (`NODE_SHAPE`) so they can't be newly selected. At the storage-read boundary, coerce each to its non-round counterpart via a `ReadTransform` on both vertex-styles atoms (`transformVertexStyles`). The mapping preserves the user's visual-differentiation intent:

| Broken shape     | Coerced to |
| ---------------- | ---------- |
| `round-triangle` | `triangle` |
| `round-pentagon` | `pentagon` |
| `round-hexagon`  | `hexagon`  |
| `round-heptagon` | `heptagon` |
| `round-octagon`  | `octagon`  |
| `round-tag`      | `tag`      |

Import stores the value verbatim — the ReadTransform coerces it on the next read from storage, so the import path stays pure and the original persisted value is never overwritten.

## Considered Options

- **Coerce at read boundaries, no write-back (chosen).** Non-destructive: stored originals survive, so a future cytoscape fix can restore them by removing the transform. Each broken shape maps to its sharp-cornered sibling, preserving shape semantics.
- **Reject on import.** Would fail the whole file under the atomic parser contract (`20260624-styling-file-format.md`), punishing users for data the app itself produced. Not acceptable.
- **Remove from `SHAPE_STYLES` / `ShapeStyle`.** Same as rejection: the Zod enum would fail old files that contain the values.
- **Coerce at import time (Zod `.transform()`).** Bakes the coerced value into storage permanently and loses the original on re-export. Makes the transform irreversible — a cytoscape fix can no longer restore the user's original choice.
- **Patch cytoscape (fork or monkey-patch).** High maintenance burden for a rendering detail that may be fixed upstream. Deferred unless upstream remains broken long-term.
- **Coerce to a single flat replacement (`round-rectangle`).** Collapses six visually distinct shapes into one, losing differentiation intent. Per-shape mapping costs one extra `Map` entry per shape and preserves semantics.

## Consequences

- Users who stored a broken shape see its non-round counterpart after upgrading — a strict improvement over the previous blob-with-no-edges.
- Styling-file round-trips are lossless in storage (never written back) but lossy in memory (the read value differs from the stored value). This is the read-time-transform ADR's purity contract applied to a new case.
- If cytoscape fixes the rendering, reversal is: restore the six entries in `NODE_SHAPE`, delete `BROKEN_SHAPE_REPLACEMENTS` and the `transformVertexStyles` ReadTransform. Stored originals reappear intact.
