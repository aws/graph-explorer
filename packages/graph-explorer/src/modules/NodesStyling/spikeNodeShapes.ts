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

// --- Round polygons ---

/**
 * The round-cornered polygon shapes. Each reuses its sharp counterpart's point
 * list (cytoscape's `round-diamond` shares `diamond`'s points) and rounds the
 * corners at draw time, so the name maps to the base shape by dropping the
 * `round-` prefix. `roundrectangle` is not here — it's an SVG `<rect rx>`.
 */
const ROUND_POLYGON_SHAPES = new Set([
  "round-triangle",
  "round-pentagon",
  "round-hexagon",
  "round-heptagon",
  "round-octagon",
  "round-diamond",
  "round-tag",
]);

type Point = { x: number; y: number };

type RoundCorner = {
  cx: number;
  cy: number;
  radius: number;
  startX: number;
  startY: number;
  stopX: number;
  stopY: number;
  counterClockwise: boolean;
};

type Vector = { len: number; nx: number; ny: number };

function unitVector(from: Point, to: Point): Vector {
  const x = to.x - from.x;
  const y = to.y - from.y;
  const len = Math.sqrt(x * x + y * y);
  return { len, nx: x / len, ny: y / len };
}

/**
 * Verbatim port of cytoscape 3.34's corner rounding (`round.mjs`
 * `getRoundCorner` with its default `isArcRadius = true`), for one polygon
 * vertex given its neighbours. Returns the arc that replaces the sharp corner:
 * a circle center, radius, the arc's start/stop points, and its winding.
 */
function getRoundCorner(
  previous: Point,
  current: Point,
  next: Point,
  radiusMax: number,
): RoundCorner {
  const v1 = unitVector(current, previous);
  const v2 = unitVector(current, next);
  const sinA = v1.nx * v2.ny - v1.ny * v2.nx;
  const sinA90 = v1.nx * v2.nx - v1.ny * -v2.ny;
  let angle = Math.asin(Math.max(-1, Math.min(1, sinA)));
  if (Math.abs(angle) < 1e-6) {
    return {
      cx: current.x,
      cy: current.y,
      radius: 0,
      startX: current.x,
      startY: current.y,
      stopX: current.x,
      stopY: current.y,
      counterClockwise: false,
    };
  }

  let radDirection = 1;
  let drawDirection = false;
  if (sinA90 < 0) {
    if (angle < 0) {
      angle = Math.PI + angle;
    } else {
      angle = Math.PI - angle;
      radDirection = -1;
      drawDirection = true;
    }
  } else if (angle > 0) {
    radDirection = -1;
    drawDirection = true;
  }

  const halfAngle = angle / 2;
  const limit = Math.min(v1.len / 2, v2.len / 2);
  let lenOut = Math.abs(
    (Math.cos(halfAngle) * radiusMax) / Math.sin(halfAngle),
  );
  let cRadius: number;
  if (lenOut > limit) {
    lenOut = limit;
    cRadius = Math.abs((lenOut * Math.sin(halfAngle)) / Math.cos(halfAngle));
  } else {
    cRadius = radiusMax;
  }

  const stopX = current.x + v2.nx * lenOut;
  const stopY = current.y + v2.ny * lenOut;
  return {
    cx: stopX - v2.ny * cRadius * radDirection,
    cy: stopY + v2.nx * cRadius * radDirection,
    radius: cRadius,
    startX: current.x + v1.nx * lenOut,
    startY: current.y + v1.ny * lenOut,
    stopX,
    stopY,
    counterClockwise: drawDirection,
  };
}

function formatPoint(x: number, y: number): string {
  return `${x.toFixed(3)},${y.toFixed(3)}`;
}

/**
 * SVG path (`d`) for a round-cornered polygon in a [0,size] box, or null if the
 * shape isn't a round polygon. The corner radius mirrors cytoscape's
 * `getRoundPolygonRadius` (`size/10`) but drops its absolute 8px cap so the
 * preview stays proportional when drawn larger than the graph's real node.
 */
export function getRoundPolygonPath(
  shape: string,
  size: number,
): string | null {
  if (!ROUND_POLYGON_SHAPES.has(shape)) {
    return null;
  }
  const basePoints = POLYGON_POINTS[shape.slice("round-".length)];
  if (!basePoints) {
    return null;
  }

  const half = size / 2;
  const cornerRadius = size / 10;
  const vertices: Point[] = [];
  for (let i = 0; i < basePoints.length / 2; i++) {
    vertices.push({
      x: half + basePoints[2 * i] * half,
      y: half + basePoints[2 * i + 1] * half,
    });
  }

  const count = vertices.length;
  const segments: string[] = [];
  for (let i = 0; i < count; i++) {
    const corner = getRoundCorner(
      vertices[(i - 1 + count) % count],
      vertices[i],
      vertices[(i + 1) % count],
      cornerRadius,
    );
    segments.push(
      `${i === 0 ? "M" : "L"} ${formatPoint(corner.startX, corner.startY)}`,
    );
    if (corner.radius === 0) {
      segments.push(`L ${formatPoint(corner.stopX, corner.stopY)}`);
    } else {
      const sweep = corner.counterClockwise ? 0 : 1;
      segments.push(
        `A ${corner.radius.toFixed(3)} ${corner.radius.toFixed(3)} 0 0 ${sweep} ${formatPoint(corner.stopX, corner.stopY)}`,
      );
    }
  }
  segments.push("Z");
  return segments.join(" ");
}
