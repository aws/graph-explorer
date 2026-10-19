import type { ResolvedIcon } from "./iconRegistry";

import { ICON_BOX, ICON_INSET } from "./iconGeometry";

/**
 * Transform to an image url, cached per resolved icon and color.
 *
 * The color is baked into SVG markup because the callers render the icon as a
 * separate image document — the cytoscape `background-image`, the `<image>`
 * element in a vertex symbol, and the `<img>` in a vertex icon — which CSS
 * cannot reach. Lucide icons render as live DOM and inherit `color` instead, so
 * they never call this.
 *
 * No size is applied. Each consumer fits the icon itself against the icon's own
 * `viewBox` (`preserveAspectRatio`, or `object-contain` on the `<img>`);
 * overriding its intrinsic size here would only fight that.
 *
 * Carries no inset: `VertexSymbolIcon` applies its own in its SVG coordinates.
 * The canvas needs {@link toCanvasBackgroundImage} instead.
 */
export function toIconImageUrl(icon: ResolvedIcon, color: string): string {
  switch (icon.kind) {
    case "raster":
      return icon.url;
    case "svg": {
      const urls = urlsFor(icon, color);
      return (urls.image ??= encodeSvg(applyColor(icon.svg, color)));
    }
  }
}

interface ColoredUrls {
  image?: string;
  canvas?: string;
}

/**
 * Recoloring re-renders every icon of a type and a list can show thousands, so
 * each url is built once per resolved icon and color and shared by every use.
 * Keyed by the registry's resolved object identity, so an entry leaves with its
 * icon and a registry reset can never serve a stale one.
 */
const urlCache = new WeakMap<ResolvedIcon, Map<string, ColoredUrls>>();

/**
 * Dragging a color picker visits a new color on every move. The bound sits
 * above any realistic number of types sharing one icon, because a render pass
 * cycles through all of them in order and an undersized LRU would miss on every
 * lookup.
 */
const MAX_COLORS_PER_ICON = 256;

/** Least recently used first, so an in-use color survives a picker drag. */
function urlsFor(icon: ResolvedIcon, color: string): ColoredUrls {
  let byColor = urlCache.get(icon);
  if (!byColor) {
    byColor = new Map();
    urlCache.set(icon, byColor);
  }
  // A raster is never recolored, so it keeps a single entry.
  const key = icon.kind === "svg" ? color : "";
  const urls = byColor.get(key) ?? {};
  byColor.delete(key);
  byColor.set(key, urls);
  if (byColor.size > MAX_COLORS_PER_ICON) {
    const oldest = byColor.keys().next();
    if (!oldest.done) {
      byColor.delete(oldest.value);
    }
  }
  return urls;
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

/**
 * The cytoscape `background-image` for an icon: {@link toIconImageUrl} centered
 * at {@link ICON_INSET} of a square SVG, preserving its aspect ratio.
 *
 * Cytoscape cannot do both parts itself: `background-fit: contain` keeps the
 * ratio but fills the whole node box, and the node is an ellipse, so a
 * square-ish icon's corners spill outside the shape. Explicit percentages inset
 * the icon but force both axes, which is what squashed non-square icons
 * (issue #2108). Baking the inset into a square SVG leaves cytoscape a square
 * to fit and delegates the ratio to the nested image's `preserveAspectRatio`.
 *
 * The nested icon must carry a `viewBox`, or it has no intrinsic ratio to fit
 * and fills the padded box — square again. The icon registry supplies one
 * whenever the source's size allows it.
 */
export function toCanvasBackgroundImage(
  icon: ResolvedIcon,
  color: string,
): string {
  const urls = urlsFor(icon, color);
  return (urls.canvas ??= buildCanvasBackgroundImage(icon, color));
}

function buildCanvasBackgroundImage(icon: ResolvedIcon, color: string): string {
  const svg = document.createElementNS(SVG_NAMESPACE, "svg");
  setAttributes(svg, {
    width: ICON_BOX,
    height: ICON_BOX,
    viewBox: `0 0 ${ICON_BOX} ${ICON_BOX}`,
  });
  const image = document.createElementNS(SVG_NAMESPACE, "image");
  setAttributes(image, {
    href: toIconImageUrl(icon, color),
    x: ICON_INSET.offset,
    y: ICON_INSET.offset,
    width: ICON_INSET.size,
    height: ICON_INSET.size,
    preserveAspectRatio: "xMidYMid meet",
  });
  svg.append(image);
  return encodeSvg(new XMLSerializer().serializeToString(svg));
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function setAttributes(
  element: Element,
  attributes: Record<string, string | number>,
): void {
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value));
  }
}

function encodeSvg(svgContent: string): string {
  return "data:image/svg+xml;utf8," + encodeURIComponent(svgContent);
}
