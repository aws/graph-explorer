/**
 * DOMPurify's default SVG profile drops `width`/`height`/`viewBox` — safe
 * attributes it doesn't allowlist by default — which silently breaks aspect
 * ratio for every sanitized icon. Every consumer that sanitizes an untrusted
 * SVG needs this same allowlist, so it lives here once rather than drifting
 * between the DOM and canvas render paths.
 */
export const SVG_ALLOWED_ATTR = [
  "width",
  "height",
  "viewBox",
  "xmlns",
  "preserveAspectRatio",
  "fill",
  "stroke",
  "id",
  "class",
  "style",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "cx",
  "cy",
  "r",
  "offset",
  "stop-color",
  "stop-opacity",
  "opacity",
];
