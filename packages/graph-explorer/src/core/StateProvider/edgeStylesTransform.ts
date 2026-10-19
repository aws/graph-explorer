import { logger, omitFields } from "@/utils";

import type { EdgeType } from "../entities";
import type { EdgeStyleStorage } from "./graphStyles";

import { findUnusableColors } from "./findUnusableColors";

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
    const unusableColors = findUnusableColors(entry, COLOR_FIELDS);
    for (const { field, value } of unusableColors) {
      if (value.trim()) {
        logger.warn(
          `[edge-styles] Unsupported color "${value.slice(0, 100)}" in ${field} for type "${type}", using the default`,
        );
      }
    }

    const cleaned = omitFields(
      entry,
      unusableColors.map(c => c.field),
    );
    if (cleaned !== entry) {
      result ??= new Map(styles);
      result.set(type, cleaned);
    }
  }

  return result ?? styles;
}
