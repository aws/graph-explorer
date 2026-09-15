import type { VertexStyle, VertexType } from "@/core";

import { toIconImageUrl } from "./iconImageUrl";
import {
  classifyIconSource,
  type IconSource,
  type IconSourceId,
  iconSourceId,
} from "./iconSource";
import { useResolvedIcons } from "./useResolvedIcons";

/**
 * Maps each vertex type to its cytoscape `background-image`.
 *
 * The set of UNIQUE icons is tiny (dozens) even with thousands of vertex types,
 * so resolution is keyed by icon identity and shared through the icon registry.
 * Applying the vertex color is then a pure transform, deduped by (icon, color).
 */
export function useBackgroundImageMap(
  vtConfigs: VertexStyle[],
): Map<VertexType, string> {
  // Single pass: this runs on every render over every vertex type, so each
  // config is classified once and the id is reused for both lookups below.
  const uniqueSources = new Map<IconSourceId, IconSource>();
  const identified: Array<{
    type: VertexType;
    id: IconSourceId;
    color: string;
  }> = [];
  for (const vtConfig of vtConfigs) {
    const source = classifyIconSource(vtConfig);
    const id = iconSourceId(source);
    if (id === null) {
      continue;
    }
    if (!uniqueSources.has(id)) {
      uniqueSources.set(id, source);
    }
    identified.push({ type: vtConfig.type, id, color: vtConfig.color });
  }

  const icons = useResolvedIcons([...uniqueSources.values()]);

  const result = new Map<VertexType, string>();
  const rendered = new Map<string, string>();
  for (const { type, id, color } of identified) {
    const icon = icons.get(id);
    if (!icon) {
      continue;
    }
    const renderKey = `${id}\u0000${color}`;
    let backgroundImage = rendered.get(renderKey);
    if (backgroundImage === undefined) {
      backgroundImage = toIconImageUrl(icon, color);
      rendered.set(renderKey, backgroundImage);
    }
    result.set(type, backgroundImage);
  }
  return result;
}
