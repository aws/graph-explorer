/**
 * Shared inset geometry for every icon surface. The canvas
 * (`useBackgroundImageMap`) and the style preview (`VertexSymbol`) each fit an
 * icon into a square box by `preserveAspectRatio`, and both must agree on how
 * much of that box the icon occupies — changing one without the other would
 * silently desync what the preview shows from what the canvas renders.
 *
 * {@link ICON_BOX} is not arbitrary: it is exactly 4x a canvas node's size in
 * cytoscape units (24), the same ratio `VertexSymbol`'s own viewBox already
 * uses for everything else it scales (border width, label font/padding).
 */
export const ICON_BOX = 96;

/** Fraction of {@link ICON_BOX} the icon occupies, leaving room for the shape's curve. */
export const ICON_RATIO = 0.6;

export function encodeSvg(svgContent: string): string {
  return "data:image/svg+xml;utf8," + encodeURIComponent(svgContent);
}
