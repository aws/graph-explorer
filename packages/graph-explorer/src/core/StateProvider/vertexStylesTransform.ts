import { logger } from "@/utils";

import type { VertexType } from "../entities";
import type { ShapeStyle, VertexStyleStorage } from "./graphStyles";

/**
 * Shapes that cytoscape's round-polygon renderer draws incorrectly at small
 * node size (24px): their corner computation degenerates, rendering as a blob
 * and producing invalid edge endpoints that cause edges to disappear. These are
 * kept in {@link SHAPE_STYLES} so older files still parse, but are coerced to
 * their sharp-cornered counterpart at every read boundary.
 *
 * Each broken shape maps to its non-round sibling to preserve the user's
 * visual-differentiation intent (a round-hexagon becomes a hexagon, not a
 * generic rectangle).
 */
const BROKEN_SHAPE_REPLACEMENTS = new Map<ShapeStyle, ShapeStyle>([
  ["round-triangle", "triangle"],
  ["round-pentagon", "pentagon"],
  ["round-hexagon", "hexagon"],
  ["round-heptagon", "heptagon"],
  ["round-octagon", "octagon"],
  ["round-tag", "tag"],
]);

/** Coerces a broken round-polygon shape to its non-round counterpart, passing all others through. */
export function coerceBrokenShape(shape: ShapeStyle): ShapeStyle {
  return BROKEN_SHAPE_REPLACEMENTS.get(shape) ?? shape;
}

/**
 * ReadTransform for vertex style maps: coerces broken round-polygon shapes to
 * their non-round counterpart at load time. Entries without a `shape` field are
 * passed through unchanged. Returns the same reference when no coercion was
 * needed.
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
        logger.debug(
          `[vertex-styles] Coercing broken shape "${entry.shape}" to "${coerced}" for type "${type}"`,
        );
        result.set(type, { ...entry, shape: coerced });
        changed = true;
        continue;
      }
    }
    result.set(type, entry);
  }

  return changed ? result : styles;
}
