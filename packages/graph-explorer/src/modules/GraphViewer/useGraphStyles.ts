import type cytoscape from "cytoscape";

import Color from "color";
import { useDeferredValue } from "react";

import type { GraphProps } from "@/components/Graph";
import type { StyleValue } from "@/components/Graph/hooks/useManageStyles";

import {
  appDefaultEdgeStyle,
  appDefaultVertexStyle,
  type ArrowStyle,
  type EdgeStyle,
  type EdgeType,
  type EdgeVisualStyle,
  type LineStyle,
  type ShapeStyle,
  useAllEdgeStyles,
  useAllVertexStyles,
  type VertexStyle,
  type VertexType,
  type VertexVisualStyle,
} from "@/core";

import { useBackgroundImageMap } from "./useBackgroundImageMap";

const LINE_DASH_PATTERN: Record<LineStyle, number[]> = {
  // Cytoscape's default; only read when another rule makes the line dashed.
  solid: [6, 3],
  dashed: [5, 6],
  dotted: [1, 2],
};

type VertexTypeValues = {
  "background-image": string;
  "background-color": string;
  "background-opacity": number;
  "border-color": string;
  "border-width": number;
  "border-opacity": number;
  "border-style": LineStyle;
  shape: ShapeStyle;
};

type EdgeTypeValues = {
  color: string;
  "line-color": string;
  "line-style": "solid" | "dashed";
  "line-dash-pattern": number[];
  "source-arrow-shape": ArrowStyle;
  "source-arrow-color": string;
  "target-arrow-shape": ArrowStyle;
  "target-arrow-color": string;
  "text-background-opacity": number;
  "text-background-color": string;
  "text-border-width": number;
  "text-border-color": string;
  "text-border-style": LineStyle;
  width: number;
};

const DEFAULT_VERTEX_VALUES = toVertexTypeValues(appDefaultVertexStyle, "none");
const DEFAULT_EDGE_VALUES = toEdgeTypeValues(appDefaultEdgeStyle);

export default function useGraphStyles() {
  const vtConfigs = useAllVertexStyles();
  const etConfigs = useAllEdgeStyles();

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
  deferredVtConfigs: VertexStyle[],
  deferredEtConfigs: EdgeStyle[],
  backgroundImageMap: Map<VertexType, string>,
): GraphProps["styles"] {
  const vertexValues = new Map<VertexType, VertexTypeValues>();
  for (const vtConfig of deferredVtConfigs) {
    vertexValues.set(
      vtConfig.type,
      toVertexTypeValues(
        vtConfig,
        backgroundImageMap.get(vtConfig.type) ?? "none",
      ),
    );
  }

  const edgeValues = new Map<EdgeType, EdgeTypeValues>();
  for (const etConfig of deferredEtConfigs) {
    edgeValues.set(etConfig.type, toEdgeTypeValues(etConfig));
  }

  // One rule per element kind, not per type: Cytoscape scans every rule for every element (issue #2104).
  return {
    "node[type]": {
      ...mappersByType(vertexValues, DEFAULT_VERTEX_VALUES),
      width: 24,
      height: 24,
    },
    "edge[type]": {
      ...mappersByType(edgeValues, DEFAULT_EDGE_VALUES),
      label: "data(displayName)",
      "source-distance-from-node": 0,
      "target-distance-from-node": 0,
    },
  };
}

function toVertexTypeValues(
  style: VertexVisualStyle,
  backgroundImage: string,
): VertexTypeValues {
  return {
    "background-image": backgroundImage,
    "background-color": style.color,
    "background-opacity": style.backgroundOpacity,
    "border-color": style.borderColor,
    "border-width": style.borderWidth,
    "border-opacity": style.borderWidth > 0 ? 1 : 0,
    "border-style": style.borderStyle,
    shape: style.shape,
  };
}

function toEdgeTypeValues(style: EdgeVisualStyle): EdgeTypeValues {
  return {
    color: new Color(style.labelColor || "#17457b").isDark()
      ? "#FFFFFF"
      : "#000000",
    "line-color": style.lineColor,
    "line-style": style.lineStyle === "dotted" ? "dashed" : style.lineStyle,
    "line-dash-pattern": LINE_DASH_PATTERN[style.lineStyle],
    "source-arrow-shape": style.sourceArrowStyle,
    "source-arrow-color": style.lineColor,
    "target-arrow-shape": style.targetArrowStyle,
    "target-arrow-color": style.lineColor,
    "text-background-opacity": style.labelBackgroundOpacity,
    "text-background-color": style.labelColor,
    "text-border-width": style.labelBorderWidth,
    "text-border-color": style.labelBorderColor,
    "text-border-style": style.labelBorderStyle,
    width: style.lineThickness,
  };
}

/** One Cytoscape function mapper per property, looking the element's type up in `valuesByType`. */
function mappersByType<K extends string, V extends Record<string, StyleValue>>(
  valuesByType: Map<K, V>,
  fallback: V,
) {
  return Object.fromEntries(
    Object.keys(fallback).map(property => [
      property,
      (element: cytoscape.SingularElementReturnValue) =>
        // A mapper must never return undefined, or Cytoscape keeps the element's stale value; stored styles can hold explicit undefined fields.
        (valuesByType.get(element.data("type")) ?? fallback)[property] ??
        fallback[property],
    ]),
  );
}
