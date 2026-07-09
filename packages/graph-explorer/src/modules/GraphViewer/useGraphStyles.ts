import Color from "color";
import { useDeferredValue } from "react";

import type { GraphProps } from "@/components/Graph";

import {
  buildConditionalEdgeSelector,
  buildConditionalNodeSelector,
  type EdgeStyle,
  type ResolvedConditionalEdgeStyle,
  type ResolvedConditionalVertexStyle,
  resolveConditionalEdgeStyle,
  resolveConditionalVertexStyle,
  useAllEdgeStyles,
  useAllVertexStyles,
  type VertexStyle,
} from "@/core";

import { useBackgroundImageMap } from "./useBackgroundImageMap";

const LINE_PATTERN = {
  solid: undefined,
  dashed: [5, 6],
  dotted: [1, 2],
};

export default function useGraphStyles() {
  const vtConfigs = useAllVertexStyles();
  const etConfigs = useAllEdgeStyles();

  const deferredVtConfigs = useDeferredValue(vtConfigs);
  const deferredEtConfigs = useDeferredValue(etConfigs);

  const conditionalVtStyles = deferredVtConfigs
    .map(resolveConditionalVertexStyle)
    .filter(style => style !== undefined);
  const conditionalEtStyles = deferredEtConfigs
    .map(resolveConditionalEdgeStyle)
    .filter(style => style !== undefined);

  const backgroundImageMap = useBackgroundImageMap(deferredVtConfigs);
  // A conditional style may override the icon, so its background image is
  // rendered separately, keyed by the same vertex type in an independent map.
  const conditionalBackgroundImageMap = useBackgroundImageMap(
    conditionalVtStyles.map(conditional => conditional.style),
  );

  return createGraphStyles({
    vtConfigs: deferredVtConfigs,
    etConfigs: deferredEtConfigs,
    backgroundImageMap,
    conditionalVtStyles,
    conditionalEtStyles,
    conditionalBackgroundImageMap,
  });
}

type CreateGraphStylesArgs = {
  vtConfigs: VertexStyle[];
  etConfigs: EdgeStyle[];
  backgroundImageMap: Map<string, string | null>;
  conditionalVtStyles: ResolvedConditionalVertexStyle[];
  conditionalEtStyles: ResolvedConditionalEdgeStyle[];
  conditionalBackgroundImageMap: Map<string, string | null>;
};

function createGraphStyles({
  vtConfigs,
  etConfigs,
  backgroundImageMap,
  conditionalVtStyles,
  conditionalEtStyles,
  conditionalBackgroundImageMap,
}: CreateGraphStylesArgs): GraphProps["styles"] {
  const styles: GraphProps["styles"] = {};

  for (const vtConfig of vtConfigs) {
    const backgroundImage = backgroundImageMap.get(vtConfig.type) ?? undefined;
    styles[`node[type="${vtConfig.type}"]`] = createNodeStyle(
      vtConfig,
      backgroundImage,
    );
  }

  for (const etConfig of etConfigs) {
    styles[`edge[type="${etConfig.type}"]`] = createEdgeStyle(etConfig);
  }

  // The conditional selectors come after the per-type selectors, so Cytoscape's
  // order-based cascade applies them on top for entities whose `conditionMet`
  // flag was stamped during rendering.
  for (const { style } of conditionalVtStyles) {
    const backgroundImage =
      conditionalBackgroundImageMap.get(style.type) ?? undefined;
    styles[buildConditionalNodeSelector(style.type)] = createNodeStyle(
      style,
      backgroundImage,
    );
  }

  for (const { style } of conditionalEtStyles) {
    styles[buildConditionalEdgeSelector(style.type)] = createEdgeStyle(style);
  }

  return styles;
}

function createNodeStyle(
  vtConfig: VertexStyle,
  backgroundImage: string | undefined,
) {
  return {
    "background-image": backgroundImage,
    "background-color": vtConfig.color,
    "background-opacity": vtConfig.backgroundOpacity,
    "border-color": vtConfig.borderColor,
    "border-width": vtConfig.borderWidth,
    "border-opacity": vtConfig.borderWidth > 0 ? 1 : 0,
    "border-style": vtConfig.borderStyle,
    shape: vtConfig.shape,
    width: 24,
    height: 24,
  };
}

function createEdgeStyle(etConfig: EdgeStyle) {
  return {
    label: "data(displayName)",
    color: new Color(etConfig.labelColor || "#17457b").isDark()
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
    "text-background-opacity": etConfig.labelBackgroundOpacity,
    "text-background-color": etConfig.labelColor,
    "text-border-width": etConfig.labelBorderWidth,
    "text-border-color": etConfig.labelBorderColor,
    "text-border-style": etConfig.labelBorderStyle,
    width: etConfig.lineThickness,
    "source-distance-from-node": 0,
    "target-distance-from-node": 0,
  };
}
