import type { ArrowPrimitive } from "./arrowShapes";

/**
 * Renders a single resolved arrow primitive (polygon, path, or circle) as an
 * SVG child. Shared by the edge preview and the arrow-style icon so both draw
 * cytoscape's arrow geometry identically.
 */
export function ArrowPrimitiveShape({
  primitive,
}: {
  primitive: ArrowPrimitive;
}) {
  if (primitive.kind === "circle") {
    return <circle cx={primitive.cx} cy={primitive.cy} r={primitive.r} />;
  }
  if (primitive.kind === "path") {
    return <path d={primitive.d} />;
  }
  const points = primitive.points.map(([x, y]) => `${x},${y}`).join(" ");
  return <polygon points={points} />;
}
