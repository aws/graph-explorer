/**
 * SPIKE — throwaway. Verbatim port of cytoscape 3.34.0's node-shape point
 * generation (`generateUnitNgonPoints` / `fitPolygonToSquare`) plus its
 * hardcoded special-shape point lists, so an SVG `<polygon>` draws the exact
 * same geometry cytoscape rasterizes to canvas. Points live in a [-1,1] box
 * (x right, y down in SVG terms — cytoscape uses y-down too).
 */

type Points = number[];

function generateUnitNgonPoints(
  sides: number,
  rotationRadians: number,
): Points {
  const increment = (1.0 / sides) * 2 * Math.PI;
  let startAngle =
    sides % 2 === 0 ? Math.PI / 2.0 + increment / 2.0 : Math.PI / 2.0;
  startAngle += rotationRadians;
  const points: number[] = Array.from({ length: sides * 2 });
  for (let i = 0; i < sides; i++) {
    const currentAngle = i * increment + startAngle;
    points[2 * i] = Math.cos(currentAngle);
    points[2 * i + 1] = Math.sin(-currentAngle);
  }
  return points;
}

function fitPolygonToSquare(points: Points): Points {
  const sides = points.length / 2;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < sides; i++) {
    const x = points[2 * i];
    const y = points[2 * i + 1];
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const sx = 2 / (maxX - minX);
  const sy = 2 / (maxY - minY);
  minY = Infinity;
  for (let i = 0; i < sides; i++) {
    points[2 * i] = points[2 * i] * sx;
    points[2 * i + 1] = points[2 * i + 1] * sy;
    minY = Math.min(minY, points[2 * i + 1]);
  }
  if (minY < -1) {
    for (let i = 0; i < sides; i++) {
      points[2 * i + 1] = points[2 * i + 1] + (-1 - minY);
    }
  }
  return points;
}

function ngon(sides: number, rotation = 0): Points {
  return fitPolygonToSquare(generateUnitNgonPoints(sides, rotation));
}

function star5(): Points {
  const outer = generateUnitNgonPoints(5, 0);
  const inner = generateUnitNgonPoints(5, Math.PI / 5);
  let innerRadius = 0.5 * (3 - Math.sqrt(5));
  innerRadius *= 1.57;
  for (let i = 0; i < inner.length / 2; i++) {
    inner[i * 2] *= innerRadius;
    inner[i * 2 + 1] *= innerRadius;
  }
  const pts: number[] = Array.from({ length: 20 });
  for (let i = 0; i < 20 / 4; i++) {
    pts[i * 4] = outer[i * 2];
    pts[i * 4 + 1] = outer[i * 2 + 1];
    pts[i * 4 + 2] = inner[i * 2];
    pts[i * 4 + 3] = inner[i * 2 + 1];
  }
  return fitPolygonToSquare(pts);
}

/** Polygon point lists keyed by cytoscape shape name. Non-polygon shapes
 * (ellipse, the round-/cut-/barrel rectangles) are handled separately. */
const POLYGON_POINTS: Record<string, Points> = {
  triangle: ngon(3, 0),
  rectangle: ngon(4, 0),
  square: ngon(4, 0),
  pentagon: ngon(5, 0),
  hexagon: ngon(6, 0),
  heptagon: ngon(7, 0),
  octagon: ngon(8, 0),
  diamond: [0, -1, 1, 0, 0, 1, -1, 0],
  star: star5(),
  vee: fitPolygonToSquare([-1, -1, 0, -0.333, 1, -1, 0, 1]),
  rhomboid: fitPolygonToSquare([-1, -1, 0.333, -1, 1, 1, -0.333, 1]),
  tag: fitPolygonToSquare([-1, -1, 0.25, -1, 1, 0, 0.25, 1, -1, 1]),
  "concave-hexagon": fitPolygonToSquare([
    -1, -0.95, -0.75, 0, -1, 0.95, 1, 0.95, 0.75, 0, 1, -0.95,
  ]),
};

/** Maps a [-1,1] point list to an SVG `points` string in a [0,size] box. */
export function toSvgPoints(points: Points, size: number): string {
  const half = size / 2;
  const parts: string[] = [];
  for (let i = 0; i < points.length / 2; i++) {
    const x = half + points[2 * i] * half;
    const y = half + points[2 * i + 1] * half;
    parts.push(`${x.toFixed(3)},${y.toFixed(3)}`);
  }
  return parts.join(" ");
}

export function getPolygonPoints(shape: string): Points | null {
  return POLYGON_POINTS[shape] ?? null;
}
