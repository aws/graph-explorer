import type { VertexType } from "../entities";
import type { ShapeStyle, VertexStyleStorage } from "./graphStyles";

/**
 * Shapes that cytoscape's round-polygon renderer draws incorrectly at small
 * node size (24px): their corner computation degenerates, rendering as a blob
 * and producing invalid edge endpoints that cause edges to disappear. These are
 * kept in {@link SHAPE_STYLES} so older files still parse, but are coerced to
 * `round-rectangle` at every read boundary.
 */
const BROKEN_ROUND_POLYGON_SHAPES: ReadonlySet<ShapeStyle> = new Set([
  "round-triangle",
  "round-pentagon",
  "round-hexagon",
  "round-heptagon",
  "round-octagon",
  "round-tag",
]);

const BROKEN_SHAPE_REPLACEMENT: ShapeStyle = "roundrectangle";

/** Coerces a broken round-polygon shape to `round-rectangle`, passing all others through. */
export function coerceBrokenShape(shape: ShapeStyle): ShapeStyle {
  return BROKEN_ROUND_POLYGON_SHAPES.has(shape)
    ? BROKEN_SHAPE_REPLACEMENT
    : shape;
}

/**
 * ReadTransform for vertex style maps: coerces broken round-polygon shapes to
 * `round-rectangle` at load time. Entries without a `shape` field are passed
 * through unchanged. Returns the same reference when no coercion was needed.
 */
export function transformVertexStyles(
  styles: Map<VertexType, VertexStyleStorage>,
): Map<VertexType, VertexStyleStorage> {
  let changed = false;
  const result = new Map<VertexType, VertexStyleStorage>();

  for (const [type, entry] of styles) {
    if (entry.shape !== undefined) {
      const coerced = coerceBrokenShape(entry.shape);
      if (coerced !== entry.shape) {
        result.set(type, { ...entry, shape: coerced });
        changed = true;
        continue;
      }
    }
    result.set(type, entry);
  }

  return changed ? result : styles;
}
