import type { VertexType } from "../entities";

import { coerceBrokenShape, type VertexStyleStorage } from "./graphStyles";

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
