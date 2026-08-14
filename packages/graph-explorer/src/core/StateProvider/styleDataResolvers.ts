import { useBackgroundImageMap } from "@/core/icons";

import type { VertexType } from "../entities";
import type { VertexStyle } from "./graphStyles";

import { type VertexStyleData, vertexStyleData } from "./graphElementStyleData";

/**
 * Style data per vertex type. Both the scalar fields and the icon come from the
 * same style list, so a type in the result always has both.
 *
 * Resolving per type rather than per element is what keeps the cost bounded by
 * the types drawn: N nodes of a type cost one `vertexStyleData` call, and the
 * caller decides the scope — the canvas passes the handful of types it draws,
 * the schema view every type.
 */
export function useVertexStyleDataByType(
  styles: Iterable<VertexStyle>,
): Map<VertexType, VertexStyleData> {
  const styleList = [...styles];
  const backgroundImages = useBackgroundImageMap(styleList);

  const result = new Map<VertexType, VertexStyleData>();
  for (const style of styleList) {
    result.set(
      style.type,
      vertexStyleData(style, backgroundImages.get(style.type)),
    );
  }
  return result;
}
