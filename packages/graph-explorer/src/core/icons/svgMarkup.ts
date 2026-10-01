import DOMPurify from "dompurify";

/**
 * Ensures an SVG has a `viewBox`, synthesizing one from `width`/`height` when
 * absent.
 *
 * Without a `viewBox`, an SVG has no internal coordinate system to scale from:
 * forcing a different CSS or attribute size on the root just clips the content
 * to the new box instead of scaling it (`preserveAspectRatio` has nothing to
 * map). A synthesized `viewBox="0 0 <width> <height>"` gives the renderer that
 * mapping, so resizing scales instead of crops.
 */
export function ensureSvgViewBox(svg: string): string {
  const doc = new DOMParser().parseFromString(svg, "application/xml");
  const root = doc.documentElement;
  if (root.localName !== "svg" || root.hasAttribute("viewBox")) {
    return svg;
  }

  const width = parseFiniteLength(root.getAttribute("width"));
  const height = parseFiniteLength(root.getAttribute("height"));
  if (width === null || height === null) {
    return svg;
  }

  root.setAttribute("viewBox", `0 0 ${width} ${height}`);
  return new XMLSerializer().serializeToString(root);
}

/**
 * Sanitizes untrusted SVG markup and ensures the result carries a `viewBox`.
 *
 * `USE_PROFILES` is what keeps `width`, `height`, and `viewBox`: DOMPurify
 * rebuilds `ALLOWED_ATTR` from the profiles, so an explicit list would be
 * silently ignored.
 */
export function sanitizeSvg(svg: string): string {
  const sanitized = DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
  });
  return ensureSvgViewBox(sanitized);
}

/** A unitless or `px` length, the only units that match the content's user units. */
const USER_UNIT_LENGTH = /^\s*(\d*\.?\d+(?:e[+-]?\d+)?)\s*(?:px)?\s*$/i;

/**
 * Parses an SVG `width`/`height` as a positive, finite number of user units,
 * or `null`. Percentages and other units carry no recoverable ratio in user
 * units, so such an SVG keeps filling its box; guessing would be worse.
 */
function parseFiniteLength(value: string | null): number | null {
  const match = value === null ? null : USER_UNIT_LENGTH.exec(value);
  if (!match) {
    return null;
  }
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
