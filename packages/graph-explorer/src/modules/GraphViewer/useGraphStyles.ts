import Color from "color";
import { useDeferredValue } from "react";

import type { GraphProps } from "@/components/Graph";

import {
  type EdgePreferences,
  useAllEdgePreferences,
  useAllVertexPreferences,
  type VertexPreferences,
} from "@/core";

import { useBackgroundImageMap } from "./useBackgroundImageMap";

const LINE_PATTERN = {
  solid: undefined,
  dashed: [5, 6],
  dotted: [1, 2],
};

export default function useGraphStyles() {
  const vtConfigs = useAllVertexPreferences();
  const etConfigs = useAllEdgePreferences();

  const deferredVtConfigs = useDeferredValue(vtConfigs);
  const deferredEtConfigs = useDeferredValue(etConfigs);

  const backgroundImageMap = useBackgroundImageMap(deferredVtConfigs);

  return createGraphStyles(
    deferredVtConfigs,
    deferredEtConfigs,
    backgroundImageMap,
  );
}

function createGraphStyles(
  deferredVtConfigs: VertexPreferences[],
  deferredEtConfigs: EdgePreferences[],
  backgroundImageMap: Map<string, string | null>,
): GraphProps["styles"] {
  const styles: GraphProps["styles"] = {};

  for (const vtConfig of deferredVtConfigs) {
    const vt = vtConfig.type;

    // Process the image data or SVG
    const backgroundImage = backgroundImageMap.get(vt) ?? undefined;

    styles[`node[type="${vt}"]`] = {
      "background-image": backgroundImage,
      "background-color": vtConfig.color,
      "background-opacity": vtConfig.backgroundOpacity,
      "border-color": vtConfig.borderColor,
      "border-width": vtConfig.borderWidth,
      "border-style": vtConfig.borderStyle,
      shape: vtConfig.shape,
      width: 24,
      height: 24,
    };
  }

  for (const etConfig of deferredEtConfigs) {
    const et = etConfig?.type;

    styles[`edge[type="${et}"]`] = {
      label: "data(displayName)",
      color: new Color(etConfig?.labelColor || "#17457b").isDark()
        ? "#FFFFFF"
        : "#000000",
      "line-color": etConfig.lineColor,
      "line-style":
        etConfig.lineStyle === "dotted" ? "dashed" : etConfig.lineStyle,
      "line-dash-pattern": etConfig.lineStyle
        ? LINE_PATTERN[etConfig.lineStyle]
        : undefined,
      "source-arrow-shape": etConfig.sourceArrowStyle,
      "source-arrow-color": etConfig.lineColor,
      "target-arrow-shape": etConfig.targetArrowStyle,
      "target-arrow-color": etConfig.lineColor,
      "text-background-opacity": etConfig?.labelBackgroundOpacity,
      "text-background-color": etConfig?.labelColor,
      "text-border-width": etConfig?.labelBorderWidth,
      "text-border-color": etConfig?.labelBorderColor,
      "text-border-style": etConfig?.labelBorderStyle,
      width: etConfig.lineThickness,
      "source-distance-from-node": 0,
      "target-distance-from-node": 0,
    };
  }
  return styles;
}
