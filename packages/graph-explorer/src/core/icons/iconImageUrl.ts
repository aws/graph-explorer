import type { ResolvedIcon } from "./iconRegistry";

import { fitAspectRatio } from "./aspectFit";

/** Intrinsic size baseline; matches the cytoscape node size. */
const ICON_SIZE = 24;

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
      return encodeSvg(
        applySizeAndColor(icon.svg, color, icon.width, icon.height),
      );
  }
}

/**
 * Sets the SVG's own intrinsic width/height. This must preserve the icon's
 * real aspect ratio (scaled to fit a 24px box), not force a fixed square:
 * forcing a square here bakes a mismatched-aspect letterbox into the
 * rasterized image, which the consumer's own aspect-aware background-width/
 * height then stretches a second time, distorting worse than doing nothing.
 */
function applySizeAndColor(
  svgContent: string,
  color: string,
  naturalWidth?: number,
  naturalHeight?: number,
): string {
  const doc = new DOMParser().parseFromString(svgContent, "application/xml");
  const root = doc.documentElement;
  const [width, height] = fitToIconSize(naturalWidth, naturalHeight);
  root.setAttribute("width", String(width));
  root.setAttribute("height", String(height));
  applyColor(root, color);
  return new XMLSerializer().serializeToString(root);
}

function fitToIconSize(
  naturalWidth?: number,
  naturalHeight?: number,
): [width: number, height: number] {
  if (!naturalWidth || !naturalHeight) {
    return [ICON_SIZE, ICON_SIZE];
  }
  return fitAspectRatio(naturalWidth, naturalHeight, ICON_SIZE);
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
