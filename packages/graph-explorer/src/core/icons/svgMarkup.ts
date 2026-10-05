import DOMPurify from "dompurify";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

/**
 * Sanitizes untrusted SVG markup in one parse, ensuring it carries a `viewBox`,
 * or `null` when it is not a single `<svg>` (e.g. a 404 page).
 *
 * `USE_PROFILES` is what keeps `width`, `height`, and `viewBox`: DOMPurify
 * rebuilds `ALLOWED_ATTR` from the profiles, so an explicit list would be
 * silently ignored.
 */
export function sanitizeSvg(svg: string): string | null {
  const fragment = DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    RETURN_DOM_FRAGMENT: true,
  });
  const root = fragment.firstElementChild;
  if (
    fragment.childElementCount !== 1 ||
    root?.localName !== "svg" ||
    root.namespaceURI !== SVG_NAMESPACE
  ) {
    return null;
  }
  synthesizeViewBox(root);
  return new XMLSerializer().serializeToString(root);
}

/**
 * Gives a `viewBox`-less SVG one from its `width`/`height`. Without it there is
 * no coordinate system to scale from, so `preserveAspectRatio` crops instead.
 */
function synthesizeViewBox(root: Element): void {
  if (root.hasAttribute("viewBox")) {
    return;
  }
  const width = parseFiniteLength(root.getAttribute("width"));
  const height = parseFiniteLength(root.getAttribute("height"));
  if (width !== null && height !== null) {
    root.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }
}

/** A unitless or `px` length, the only units that match the content's user units. */
const USER_UNIT_LENGTH = /^\s*(\d*\.?\d+(?:e[+-]?\d+)?)(?:px)?\s*$/i;

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
