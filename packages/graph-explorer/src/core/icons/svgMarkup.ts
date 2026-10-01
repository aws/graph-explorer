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
 * Every caller that renders a non-lucide SVG runs this same sequence, so it
 * lives once here rather than as a copy at each call site.
 *
 * `USE_PROFILES` (not an explicit `ALLOWED_ATTR`) is what keeps `width`,
 * `height`, and `viewBox` through sanitization — DOMPurify rebuilds
 * `ALLOWED_ATTR` from the profile sets whenever `USE_PROFILES` is set, so an
 * explicit allowlist alongside it would silently never take effect.
 */
export function sanitizeSvg(svg: string): string {
  const sanitized = DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
  });
  return ensureSvgViewBox(sanitized);
}

/**
 * Parses an SVG `width`/`height` attribute as a positive, finite number of
 * user units, or `null` if it is not one.
 *
 * `parseFloat` alone lets three malformed inputs through: `NaN`/`-5`/`0` are
 * already guarded, but `"1e400"` parses to `Infinity` (a `viewBox="0 0
 * Infinity Infinity"` that blanks the icon) and `"100%"` parses to the
 * unitless number `100` (a bogus viewBox that crops the artwork instead of
 * scaling it, since a percentage has no meaning without a viewport to
 * resolve against). A plain unit suffix like `"400px"` is legitimate SVG and
 * must still parse, so only a trailing `%` is rejected, not every non-digit
 * suffix.
 *
 * Rejecting `%` trades one bug for a smaller one: an svg with no other size
 * hint (`width="100%" height="100%"`, no `viewBox`) still gets no `viewBox`
 * synthesized, so `ensureSvgViewBox` returns it unchanged and it still fills
 * its box as a square — issue #2108, for this one input. There is no fix
 * available at this layer: the percentage carries no aspect ratio to recover,
 * and guessing one would be worse than the known, tested gap this leaves.
 */
function parseFiniteLength(value: string | null): number | null {
  if (value === null || value.trimEnd().endsWith("%")) {
    return null;
  }
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
