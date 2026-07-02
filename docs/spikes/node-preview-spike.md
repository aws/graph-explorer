# Spike — DOM/SVG node preview vs cytoscape canvas

**Branch:** `spike/node-preview` (throwaway; files prefixed `Spike`/`spike`)
**Question:** Can a DOM/SVG preview render a vertex style faithfully enough to
match cytoscape's canvas node, for use in the style dialogs, search results,
legend, node details, etc.?

## Verdict: GO (Approach A)

Rendering shapes as SVG using **cytoscape's own point geometry** works. The
prior failed attempts hand-authored shape paths by eye; the unlock is porting
cytoscape 3.34's `generateUnitNgonPoints` + `fitPolygonToSquare` (and its
hardcoded special-shape point lists: star, vee, rhomboid, tag, concave-hexagon)
verbatim, so the SVG `<polygon>` uses the identical points cytoscape rasterizes.
See `packages/graph-explorer/src/modules/NodesStyling/spikeNodeShapes.ts`.

Confirmed matching against canvas: sharp polygons (triangle…octagon), diamond,
star, ellipse, rectangles.

## Key mechanism learned: icon clipping, not sizing

Cytoscape sizes the icon to fill the node box and relies on
`background-clip: 'node'` to clip the overflow to the shape outline. The preview
must do the same: render the shape into an SVG `<clipPath>` and clip the icon
`<image>` (sized to the full box) to it. Sizing the icon smaller ("contain") is
wrong — it looks nothing like the canvas.

## Open product findings (decide when building the real NodePreview)

1. **Round-\* shapes.** `generateRoundPolygon` (rounded-corner variants of the
   sharp polygons) was not ported in the spike — round-octagon/pentagon/etc.
   fall back to an ellipse. Portable to fix. BUT: verify in shipping code
   whether the canvas even renders these variants distinctly and whether users
   pick them. If low value, **curate `NODE_SHAPE`** down instead of building
   preview geometry for shapes nobody uses.
2. **Icon overflow is faithful, but is it desired?** A tall icon fills the box
   and gets clipped to the shape — so on a diamond the icon corners are cut off.
   The preview reproduces this exactly. Whether the _graph itself_ should inset
   icons is a separate, out-of-scope product question.

## Fidelity gate

Judged by eyeballing both preview cells against the live canvas node in the
style dialog — no pixel-diff harness. Sufficient for go/no-go.
