import type { ArrowStyle } from "@/core";

/**
 * Verbatim port of cytoscape 3.34.0's arrow-shape geometry so an SVG preview
 * draws the exact same arrow heads cytoscape rasterizes to canvas.
 *
 * Cytoscape authors each arrow in a normalized frame (arrow-shapes.mjs:13-16):
 *   (0, 0)  is the arrow TIP
 *   (0, 1)  is the direction TOWARD the node
 *   (1, 0)  is "right" relative to the edge
 *
 * The preview draws a horizontal edge with the arrow pointing right (toward a
 * node on the right), so we map the cytoscape frame to screen space with:
 *   screenX = y * unit   (toward-node axis → rightward; tip at 0, body at x<0)
 *   screenY = x * unit   (right axis → down; shapes are vertically symmetric)
 * A source arrow is the mirror of a target arrow (flip horizontally).
 *
 * `unit` is pixels-per-cytoscape-unit — the `size` value cytoscape multiplies
 * every normalized point by: `getArrowWidth(width) * renderScale`.
 */

/**
 * Cytoscape's arrow size (edge-arrows.mjs:167): the multiplier applied to the
 * normalized points, with a hard floor of 29 and sub-linear growth. arrowScale
 * defaults to 1 and Graph Explorer never overrides it.
 */
export function getArrowWidth(edgeWidth: number): number {
  return Math.max(Math.pow(edgeWidth * 13.37, 0.9), 29);
}

/** Cytoscape's `standardGap` (arrow-shapes.mjs:77): width * arrowScale * 2. */
function standardGap(lineWidthPx: number): number {
  return lineWidthPx * 2;
}

type Vec2 = readonly [number, number];

/** Flat cytoscape point array [x0,y0,x1,y1,…] → screen point pairs. */
function toScreen(points: readonly number[], unit: number): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 0; i < points.length; i += 2) {
    out.push([points[i + 1] * unit, points[i] * unit]);
  }
  return out;
}

// --- Cytoscape normalized point arrays (arrow-shapes.mjs) ---

const TRIANGLE = [-0.15, -0.3, 0, 0, 0.15, -0.3];
const VEE = [-0.15, -0.3, 0, 0, 0.15, -0.3, 0, -0.15];
const SQUARE = [-0.15, 0.0, 0.15, 0.0, 0.15, -0.3, -0.15, -0.3];
const DIAMOND = [-0.15, -0.15, 0, -0.3, 0.15, -0.15, 0, 0];
const TEE = [-0.15, 0, -0.15, -0.1, 0.15, -0.1, 0.15, 0];
const TRIANGLE_TEE_TRI = [0, 0, 0.15, -0.3, -0.15, -0.3, 0, 0];
const TRIANGLE_TEE_BAR = [-0.15, -0.4, -0.15, -0.5, 0.15, -0.5, 0.15, -0.4];
const CIRCLE_TRIANGLE_TRI = [0, -0.15, 0.15, -0.45, -0.15, -0.45, 0, -0.15];
const BACKCURVE_CONTROL = [0, -0.15];
const CIRCLE_RADIUS = 0.15;

/**
 * The cross bar for `triangle-cross`, whose thickness tracks the edge width
 * (arrow-shapes.mjs:226): base points at y=-0.4, far edge shifted by
 * edgeWidth/size so the drawn bar is exactly one line-width thick.
 */
function triangleCrossBar(lineWidthPx: number, size: number): number[] {
  const shift = lineWidthPx / size;
  return [-0.15, -0.4, -0.15, -0.4 - shift, 0.15, -0.4 - shift, 0.15, -0.4];
}

// --- Rendered geometry ---

export type ArrowPrimitive =
  | { readonly kind: "polygon"; readonly points: Vec2[] }
  | { readonly kind: "path"; readonly d: string; readonly bounds: Vec2[] }
  | {
      readonly kind: "circle";
      readonly cx: number;
      readonly cy: number;
      readonly r: number;
    };

export type ArrowGeometry = {
  readonly primitives: ArrowPrimitive[];
  /** Screen-space bounding box of all primitives (tip is at 0,0). */
  readonly bbox: { minX: number; minY: number; maxX: number; maxY: number };
  /** Distance from the node boundary to the arrow tip (px). */
  readonly spacing: number;
  /** Distance from the node boundary to where the edge line stops (px). */
  readonly gap: number;
};

function polygon(points: readonly number[], unit: number): ArrowPrimitive {
  return { kind: "polygon", points: toScreen(points, unit) };
}

/**
 * The `triangle-backcurve` shape (arrow-shapes.mjs:141): the triangle points
 * connected by straight lines, then a quadratic curve from the last point back
 * to the first, bowing the base inward through the control point. The curve
 * stays inside the triangle, so the triangle points bound it.
 */
function backcurvePath(unit: number): ArrowPrimitive {
  const points = toScreen(TRIANGLE, unit);
  const [p0, p1, p2] = points;
  const [ctrlX, ctrlY] = toScreen(BACKCURVE_CONTROL, unit)[0];
  const d = `M ${p0[0]} ${p0[1]} L ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} Q ${ctrlX} ${ctrlY} ${p0[0]} ${p0[1]} Z`;
  return { kind: "path", d, bounds: points };
}

function boundingBox(primitives: ArrowPrimitive[]) {
  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;
  for (const p of primitives) {
    if (p.kind === "circle") {
      minX = Math.min(minX, p.cx - p.r);
      maxX = Math.max(maxX, p.cx + p.r);
      minY = Math.min(minY, p.cy - p.r);
      maxY = Math.max(maxY, p.cy + p.r);
    } else {
      const points = p.kind === "polygon" ? p.points : p.bounds;
      for (const [x, y] of points) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Resolves a cytoscape arrow style into SVG-ready primitives (tip at origin,
 * body extending to negative X) plus the spacing/gap that position it against
 * the node. Returns null for `none`.
 *
 * @param style the cytoscape arrow-shape name
 * @param unit pixels per cytoscape unit — `getArrowWidth(width) * renderScale`
 * @param lineWidthPx the rendered line thickness in px (for gap + cross bar)
 */
export function resolveArrowGeometry(
  style: ArrowStyle,
  unit: number,
  lineWidthPx: number,
): ArrowGeometry | null {
  const primitives: ArrowPrimitive[] = [];
  let spacing = 0;
  let gap = standardGap(lineWidthPx);

  switch (style) {
    case "none":
      return null;
    case "triangle":
      primitives.push(polygon(TRIANGLE, unit));
      break;
    case "vee":
      primitives.push(polygon(VEE, unit));
      gap = standardGap(lineWidthPx) * 0.525;
      break;
    case "square":
      primitives.push(polygon(SQUARE, unit));
      break;
    case "diamond":
      primitives.push(polygon(DIAMOND, unit));
      gap = lineWidthPx;
      break;
    case "tee":
      primitives.push(polygon(TEE, unit));
      // Cytoscape uses a literal 1px spacing/gap for tee (arrow-shapes.mjs:296),
      // not a width-proportional value; kept verbatim rather than zoom-scaled.
      spacing = 1;
      gap = 1;
      break;
    case "triangle-tee":
      primitives.push(polygon(TRIANGLE_TEE_TRI, unit));
      primitives.push(polygon(TRIANGLE_TEE_BAR, unit));
      break;
    case "triangle-cross":
      primitives.push(polygon(TRIANGLE_TEE_TRI, unit));
      primitives.push(polygon(triangleCrossBar(lineWidthPx, unit), unit));
      break;
    case "triangle-backcurve":
      primitives.push(backcurvePath(unit));
      gap = standardGap(lineWidthPx) * 0.8;
      break;
    case "circle":
      primitives.push({
        kind: "circle",
        cx: 0,
        cy: 0,
        r: CIRCLE_RADIUS * unit,
      });
      spacing = unit * CIRCLE_RADIUS;
      break;
    case "circle-triangle":
      primitives.push({
        kind: "circle",
        cx: 0,
        cy: 0,
        r: CIRCLE_RADIUS * unit,
      });
      primitives.push(polygon(CIRCLE_TRIANGLE_TRI, unit));
      spacing = unit * CIRCLE_RADIUS;
      break;
    default:
      style satisfies never;
      primitives.push(polygon(TRIANGLE, unit));
      break;
  }

  return { primitives, bbox: boundingBox(primitives), spacing, gap };
}
