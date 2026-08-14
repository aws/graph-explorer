import type { ResolvedIcon } from "./iconRegistry";

/** Intrinsic size; both consumers scale from it. Matches the cytoscape node size. */
const ICON_SIZE = "24";

/**
 * Pure transform to an image url.
 *
 * The color is baked into SVG markup because the callers render the icon as a
 * separate image document — the cytoscape `background-image`, and the `<image>`
 * element used for untrusted SVG — which CSS cannot reach. Icons rendered as
 * live DOM inherit `color` instead and never call this.
 */
export function toIconImageUrl(icon: ResolvedIcon, color: string): string {
  switch (icon.kind) {
    case "raster":
      return icon.url;
    case "svg":
      return encodeSvg(applySizeAndColor(icon.svg, color));
  }
}

function applySizeAndColor(svgContent: string, color: string): string {
  const doc = new DOMParser().parseFromString(svgContent, "application/xml");
  const root = doc.documentElement;
  root.setAttribute("width", ICON_SIZE);
  root.setAttribute("height", ICON_SIZE);
  applyColor(root, color);
  return new XMLSerializer().serializeToString(root);
}

/**
 * Sets `color` on the root so `currentColor`-authored icons follow the vertex
 * color by inheritance; hardcoded fills are left untouched. Isolated here so
 * switching to "tint everything" stays a one-function change (issue #2105).
 */
function applyColor(root: Element, color: string): void {
  const existing = root.getAttribute("style");
  root.setAttribute(
    "style",
    existing ? `${existing};color:${color}` : `color:${color}`,
  );
}

function encodeSvg(svgContent: string): string {
  return "data:image/svg+xml;utf8," + encodeURIComponent(svgContent);
}
