import { isAllowedIconValue } from "@/core/icons";
import { logger, omitFields } from "@/utils";

import type { VertexType } from "../entities";
import type { ShapeStyle, VertexStyleStorage } from "./graphStyles";

import { findUnusableColors } from "./findUnusableColors";

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

const COLOR_FIELDS = ["color", "borderColor"] as const;

/**
 * Drops an icon outside the allowlist, with its image type, so the default
 * icon applies. The app only ever writes allowlisted icons, so this catches
 * hand-edited values, such as a remote url. An empty url means "no icon" and is kept.
 */
function dropDisallowedIcon(
  type: VertexType,
  entry: VertexStyleStorage,
): VertexStyleStorage | null {
  if (!entry.iconUrl || isAllowedIconValue(entry.iconUrl)) {
    return null;
  }
  logger.warn(
    `[vertex-styles] Unsupported icon "${entry.iconUrl.slice(0, 100)}" for type "${type}", using the default icon`,
  );
  return omitFields(entry, ["iconUrl", "iconImageType"]);
}

/**
 * ReadTransform for vertex style maps: coerces broken round-polygon shapes to
 * their non-round counterpart and drops colors that are not colors and icons
 * outside the allowlist at load time.
 * Returns the same reference when nothing needed changing.
 */
export function transformVertexStyles(
  styles: Map<VertexType, VertexStyleStorage>,
): Map<VertexType, VertexStyleStorage> {
  let result: Map<VertexType, VertexStyleStorage> | null = null;

  for (const [type, entry] of styles) {
    const unusableColors = findUnusableColors(entry, COLOR_FIELDS);
    for (const { field, value } of unusableColors) {
      if (value.trim()) {
        logger.warn(
          `[vertex-styles] Unsupported color "${value.slice(0, 100)}" in ${field} for type "${type}", using the default`,
        );
      }
    }

    let updated = omitFields(
      entry,
      unusableColors.map(c => c.field),
    );
    updated = dropDisallowedIcon(type, updated ?? entry) ?? updated;

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
