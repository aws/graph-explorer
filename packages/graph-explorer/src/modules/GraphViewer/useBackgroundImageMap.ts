import type { VertexStyle, VertexType } from "@/core";

import {
  classifyIconSource,
  fitAspectRatio,
  type IconSource,
  type IconSourceId,
  iconSourceId,
  type ResolvedIcon,
  toIconImageUrl,
  useResolvedIcons,
} from "@/core/icons";

export interface BackgroundImageData {
  url: string;
  width: string;
  height: string;
}

/**
 * Maps each vertex type to its cytoscape `background-image` with aspect-ratio-aware dimensions.
 *
 * The set of UNIQUE icons is tiny (dozens) even with thousands of vertex types,
 * so resolution is keyed by icon identity and shared through the icon registry.
 * Applying the vertex color is then a pure transform, deduped by (icon, color).
 */
export function useBackgroundImageMap(
  vtConfigs: VertexStyle[],
): Map<VertexType, BackgroundImageData> {
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

  const result = new Map<VertexType, BackgroundImageData>();
  const rendered = new Map<string, BackgroundImageData>();
  for (const { type, id, color } of identified) {
    const icon = icons.get(id);
    if (!icon) {
      continue;
    }
    const renderKey = `${id}|${color}`;
    let imageData = rendered.get(renderKey);
    if (imageData === undefined) {
      const url = toIconImageUrl(icon, color);
      const { width, height } = computeAspectRatioAwareDimensions(icon);
      imageData = { url, width, height };
      rendered.set(renderKey, imageData);
    }
    result.set(type, imageData);
  }
  return result;
}

const BASE_PERCENT = 60;

function computeAspectRatioAwareDimensions(icon: ResolvedIcon): {
  width: string;
  height: string;
} {
  if (!icon.width || !icon.height) {
    return { width: "60%", height: "60%" };
  }

  const [width, height] = fitAspectRatio(icon.width, icon.height, BASE_PERCENT);
  return {
    width: toPercent(width),
    height: toPercent(height),
  };
}

// The untouched axis stays an exact "60%" rather than "60.0%", matching the
// existing default so this is a no-op change in style output for square icons.
function toPercent(value: number): string {
  return value === BASE_PERCENT ? "60%" : `${value.toFixed(1)}%`;
}
