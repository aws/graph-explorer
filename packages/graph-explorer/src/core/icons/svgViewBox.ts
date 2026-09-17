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
  try {
    const doc = new DOMParser().parseFromString(svg, "application/xml");
    const root = doc.documentElement;
    if (root.localName !== "svg" || root.hasAttribute("viewBox")) {
      return svg;
    }

    const width = parseFloat(root.getAttribute("width") ?? "");
    const height = parseFloat(root.getAttribute("height") ?? "");
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      return svg;
    }

    root.setAttribute("viewBox", `0 0 ${width} ${height}`);
    return new XMLSerializer().serializeToString(root);
  } catch {
    return svg;
  }
}
