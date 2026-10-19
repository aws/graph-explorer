import type { EdgeType } from "../entities";
import type { EdgeStyleStorage } from "./graphStyles";

import { dropUnusableColors } from "./dropUnusableColors";

const COLOR_FIELDS = ["labelColor", "labelBorderColor", "lineColor"] as const;

/**
 * ReadTransform for edge style maps: drops colors that are not colors at load
 * time. Returns the same reference when nothing needed changing.
 */
export function transformEdgeStyles(
  styles: Map<EdgeType, EdgeStyleStorage>,
): Map<EdgeType, EdgeStyleStorage> {
  let result: Map<EdgeType, EdgeStyleStorage> | null = null;

  for (const [type, entry] of styles) {
    const cleaned = dropUnusableColors(entry, COLOR_FIELDS, type);
    if (cleaned) {
      result ??= new Map(styles);
      result.set(type, cleaned);
    }
  }

  return result ?? styles;
}
