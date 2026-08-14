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
 * Color fields whose value must be usable or absent. Named explicitly because
 * `iconUrl` is also a string where empty is *meaningful* — it means "no icon".
 */
const COLOR_FIELDS = ["color", "borderColor"] as const;

/**
 * Drops color fields that hold nothing renderable.
 *
 * Colors are validated as bare optional strings on import, so a styling file
 * can carry `"color": ""`. An empty value still overrides the app default
 * through the spread in `resolveVertexStyle`, leaving every consumer to render
 * a node with no background or an icon that falls back to black. Removing the
 * field instead lets the default apply — and keeps following it if it changes.
 */
function dropBlankColors(entry: VertexStyleStorage): VertexStyleStorage | null {
  let cleaned: VertexStyleStorage | null = null;

  for (const field of COLOR_FIELDS) {
    const value = entry[field];
    if (value !== undefined && !value.trim()) {
      cleaned ??= { ...entry };
      delete cleaned[field];
    }
  }

  return cleaned;
}

/**
 * ReadTransform for vertex style maps: coerces broken round-polygon shapes to
 * their non-round counterpart and drops unusable colors at load time. Returns
 * the same reference when nothing needed changing.
 */
export function transformVertexStyles(
  styles: Map<VertexType, VertexStyleStorage>,
): Map<VertexType, VertexStyleStorage> {
  let result: Map<VertexType, VertexStyleStorage> | null = null;

  for (const [type, entry] of styles) {
    let updated = dropBlankColors(entry);

    if (entry.shape !== undefined) {
      const coerced = coerceBrokenShape(entry.shape);
      if (coerced !== entry.shape) {
        logger.debug(
          `[vertex-styles] Coercing broken shape "${entry.shape}" to "${coerced}" for type "${type}"`,
        );
        updated = { ...(updated ?? entry), shape: coerced };
      }
    }

    if (updated) {
      result ??= new Map(styles);
      result.set(type, updated);
    }
  }

  return result ?? styles;
}
