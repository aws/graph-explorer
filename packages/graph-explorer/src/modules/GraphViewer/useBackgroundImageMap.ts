import type { VertexStyle, VertexType } from "@/core";

import {
  classifyIconSource,
  encodeSvg,
  ICON_BOX,
  ICON_RATIO,
  type IconSource,
  type IconSourceId,
  iconSourceId,
  insetBox,
  toIconImageUrl,
  useResolvedIcons,
} from "@/core/icons";
import { logger } from "@/utils";

/**
 * Maps each vertex type to its cytoscape `background-image`.
 *
 * The set of UNIQUE icons is tiny (dozens) even with thousands of vertex types,
 * so resolution is keyed by icon identity and shared through the icon registry.
 * Applying the vertex color is then a pure transform, deduped by (icon, color).
 */
export function useBackgroundImageMap(
  vtConfigs: VertexStyle[],
): Map<VertexType, string> {
  // Single pass: this runs on every render over every vertex type, so each
  // config is classified once and the id is reused for both lookups below.
  const uniqueSources = new Map<IconSourceId, IconSource>();
  const identified: Array<{
    type: VertexType;
    id: IconSourceId;
    color: string;
  }> = [];
  for (const vtConfig of vtConfigs) {
    const source = classifyIconSource(vtConfig);
    const id = iconSourceId(source);
    if (id === null) {
      continue;
    }
    if (!uniqueSources.has(id)) {
      uniqueSources.set(id, source);
    }
    identified.push({ type: vtConfig.type, id, color: vtConfig.color });
  }

  const icons = useResolvedIcons([...uniqueSources.values()]);

  const result = new Map<VertexType, string>();
  const rendered = new Map<string, string | null>();
  for (const { type, id, color } of identified) {
    const icon = icons.get(id);
    if (!icon) {
      continue;
    }
    // NUL cannot occur in an icon url or a color, so it is the only safe
    // separator: an IconSourceId embeds the user-supplied url verbatim.
    const renderKey = `${id}\u0000${color}`;
    // `has`, not a falsy check: a cached `null` (an unwrappable icon) must
    // short-circuit too, or every vertex type sharing it re-triggers
    // `insetIconImage` in the same pass.
    if (!rendered.has(renderKey)) {
      rendered.set(renderKey, insetIconImage(toIconImageUrl(icon, color)));
    }
    const backgroundImage = rendered.get(renderKey) ?? null;
    if (backgroundImage === null) {
      continue;
    }
    result.set(type, backgroundImage);
  }
  return result;
}

/**
 * Urls already warned about, so a stored malformed value warns once, not on
 * every render. Never shrinks, but the keyed space is bounded by the count of
 * distinct malformed urls a user has ever stored — dozens at most, the same
 * bound `useBackgroundImageMap`'s own module comment gives for unique icons.
 */
const warnedMalformedUrls = new Set<string>();

/**
 * Centers an icon at {@link ICON_RATIO} of a square canvas, preserving its
 * aspect ratio.
 *
 * Cytoscape cannot do both parts itself: `background-fit: contain` keeps the
 * ratio but fills the whole node box, and the node is an ellipse, so a
 * square-ish icon's corners spill outside the shape. Setting explicit
 * percentages insets the icon but forces both axes, which is what squashed
 * non-square icons (issue #2108). Baking the inset into a square svg leaves
 * cytoscape a square to fit, and delegates the ratio to the nested image's
 * `preserveAspectRatio`.
 *
 * The nested icon must carry a `viewBox`, or it has no intrinsic ratio to fit
 * and fills the padded box — square again. The icon registry guarantees one.
 *
 * Returns `null`, rather than throwing, for a url that is not well-formed
 * UTF-16 (e.g. a stored value containing a lone surrogate): `encodeURIComponent`
 * throws `URIError` on one, and this runs during style computation, so an
 * uncaught throw here takes down the whole app through the route-level error
 * boundary with no in-app way back. The vertex renders with no background
 * image instead. Warns once per distinct malformed url — this runs on every
 * render, and the within-render `rendered` cache above does not survive
 * between them, so without a persistent record the same url would warn again
 * on every recompute for as long as it stays stored.
 *
 * Returns the url unwrapped for a raster that is not a `data:` url. Nesting it
 * as `<image href>` inside a `data:` svg puts it in the SVG-as-image sandbox
 * (W3C SVG Integration §3.4/§3.6), which fetches nothing external — the icon
 * would render blank rather than distorted. Every reachable `iconUrl` is
 * currently `lucide:` or `data:image/*;base64,` (`stylingParser.ts`'s
 * `ICON_VALUE_PATTERN`), so this path is not known to be reachable today; it
 * exists so a future raster source cannot silently blank the canvas.
 */
function insetIconImage(iconUrl: string): string | null {
  if (!iconUrl.isWellFormed()) {
    if (!warnedMalformedUrls.has(iconUrl)) {
      warnedMalformedUrls.add(iconUrl);
      logger.warn("Icon url is not well-formed, skipping", iconUrl);
    }
    return null;
  }
  if (!iconUrl.startsWith("data:")) {
    return iconUrl;
  }
  const { size, offset } = insetBox(ICON_BOX, ICON_RATIO);
  return encodeSvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_BOX}" height="${ICON_BOX}" viewBox="0 0 ${ICON_BOX} ${ICON_BOX}">` +
      `<image href="${escapeXmlAttribute(iconUrl)}" x="${offset}" y="${offset}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>` +
      `</svg>`,
  );
}

/** The url becomes an XML attribute value, so `&`, `"`, and `<` must not break it. */
function escapeXmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
}
