# ADR — Re-implement cytoscape geometry in SVG for style previews

- **Status:** Accepted
- **Date:** 2026-07-20
- **Related:** PR #1929 (node-shape preview); issue #1947 (edge preview). Cytoscape 3.34.0 is the pinned and latest published version. Affects `components/VertexSymbol/nodeShapes.ts` and `components/EdgePreview/arrowShapes.ts`.

## Context

The node and edge style dialogs show a live preview of how a styled vertex or edge will look on the graph canvas. The canvas is rendered by cytoscape, which rasterizes node shapes and edge arrow heads to a `<canvas>` using geometry it computes internally (`math.mjs`, `arrow-shapes.mjs`). The preview is a small SVG in a React dialog, not a cytoscape instance.

For the preview to be trustworthy it must match the canvas closely — a "triangle" arrow or a "barrel" node must look the same in the dialog as it will once applied. The geometry cytoscape uses is non-trivial: fitted n-gon polygons, round-corner arc math, barrel bezier curves, and per-arrow-shape point arrays with distinct spacing/gap positioning rules.

## Decision

Port the relevant cytoscape geometry **verbatim** from the pinned cytoscape version into standalone SVG-path builders, rather than instantiating cytoscape or rasterizing to an offscreen canvas:

- `nodeShapes.ts` — `resolveShapeGeometry` ports the node-shape point lists, round-polygon corner math, round-rectangle, cut-rectangle, and barrel builders from `math.mjs`.
- `arrowShapes.ts` — `resolveArrowGeometry` ports every arrow-shape point array plus the `getArrowWidth` size formula and per-shape `spacing`/`gap` values from `arrow-shapes.mjs` and `edge-arrows.mjs`.

Each file carries a header comment naming the cytoscape source and version, and each has a sibling test (`nodeShapes.test.ts`, `arrowShapes.test.ts`) exercising every shape/style value.

**This geometry is pinned to cytoscape 3.34.0 and must be re-verified against the upstream source whenever cytoscape is upgraded.** The round-polygon defect captured in ADR `coerce-retired-round-polygon-shapes` is direct evidence that cytoscape geometry both matters and changes: a preview built on stale geometry silently drifts from the canvas.

## Considered Options

- **Verbatim SVG geometry port (chosen).** The preview renders with plain SVG — no cytoscape instance, no canvas, no layout engine — so it is cheap, synchronous, testable as pure functions, and styleable with CSS/Tailwind (dark mode, hover). Cost: the geometry is duplicated from cytoscape and must be re-checked on upgrade.
- **Instantiate a headless cytoscape per preview.** Exact by construction, but heavy: a cytoscape instance and canvas per dialog row, async layout, and no straightforward way to theme it. Overkill for a static single-element preview.
- **Rasterize shapes to bundled images.** Loses the user's live color/size/style choices — the preview must reflect the current form state, not a fixed sprite.
- **Extract cytoscape's geometry as a shared dependency.** Cytoscape does not export this math as public API; depending on internal module paths is more fragile than a reviewed, tested port with a documented source reference.

## Consequences

- Previews match the canvas without the weight of a cytoscape instance, and render as themeable, testable SVG.
- The geometry is a **pinned copy** — every cytoscape version bump requires re-verifying `nodeShapes.ts` and `arrowShapes.ts` against upstream `math.mjs`, `arrow-shapes.mjs`, and `edge-arrows.mjs`. The sibling tests guard the port's internal invariants but cannot detect upstream geometry changes; that check is manual and belongs in any cytoscape-upgrade review.
- A third preview built on the same pattern should follow suit (port + header reference + sibling test) rather than reaching for a cytoscape instance.
