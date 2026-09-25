import type { ResolvedIcon } from "./iconRegistry";

import { encodeSvg } from "./iconGeometry";

/**
 * Pure transform to an image url.
 *
 * The color is baked into SVG markup because the callers render the icon as a
 * separate image document — the cytoscape `background-image`, and the `<image>`
 * element used for untrusted SVG — which CSS cannot reach. Icons rendered as
 * live DOM inherit `color` instead and never call this.
 *
 * No size is applied. Both consumers place the icon with
 * `preserveAspectRatio`, which needs the icon's own `viewBox` to fit against;
 * overriding its intrinsic size here would only fight that.
 *
 * Do not wrap the result in another inset SVG here: `VertexSymbolIcon` already
 * insets to 60% in its own SVG coordinates, so this stays a single fit for
 * every caller. Only the canvas path (`useBackgroundImageMap`) needs its own
 * wrapper, because cytoscape — unlike an inline SVG — cannot fit an image by
 * `preserveAspectRatio` itself.
 */
export function toIconImageUrl(icon: ResolvedIcon, color: string): string {
  switch (icon.kind) {
    case "raster":
      return icon.url;
    case "svg":
      return encodeSvg(applyColor(icon.svg, color));
  }
}

/**
 * Sets `color` on the root so `currentColor`-authored icons follow the vertex
 * color by inheritance; hardcoded fills are left untouched. Isolated here so
 * switching to "tint everything" stays a one-function change (issue #2105).
 */
function applyColor(svgContent: string, color: string): string {
  const doc = new DOMParser().parseFromString(svgContent, "application/xml");
  const root = doc.documentElement;
  const existing = root.getAttribute("style");
  root.setAttribute(
    "style",
    existing ? `${existing};color:${color}` : `color:${color}`,
  );
  return new XMLSerializer().serializeToString(root);
}
