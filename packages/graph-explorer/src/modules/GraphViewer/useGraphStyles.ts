import Color from "color";
import { useDeferredValue, useEffect, useState } from "react";
import {
  getEdgeIdFromRenderedEdgeId,
  RenderedEdgeId,
  useDisplayEdgesInCanvas,
} from "@/core";
import type { GraphProps } from "@/components";
import useTextTransform from "@/hooks/useTextTransform";
import { renderNode } from "./renderNode";
import {
  useEdgeTypeConfigs,
  useVertexTypeConfigs,
} from "@/core/ConfigurationProvider/useConfiguration";
import { MISSING_DISPLAY_VALUE } from "@/utils/constants";
import { useQueryClient } from "@tanstack/react-query";

const LINE_PATTERN = {
  solid: undefined,
  dashed: [5, 6],
  dotted: [1, 2],
};

const useGraphStyles = () => {
  const vtConfigs = useVertexTypeConfigs();
  const etConfigs = useEdgeTypeConfigs();
  const textTransform = useTextTransform();
  const [styles, setStyles] = useState<GraphProps["styles"]>({});
  const displayEdges = useDisplayEdgesInCanvas();
  const client = useQueryClient();

  const deferredVtConfigs = useDeferredValue(vtConfigs);
  const deferredEtConfigs = useDeferredValue(etConfigs);

  useEffect(() => {
    (async () => {
      const styles: GraphProps["styles"] = {};

      for (const vtConfig of deferredVtConfigs) {
        const vt = vtConfig.type;

        // Process the image data or SVG
        const backgroundImage = await renderNode(client, vtConfig);

        styles[`node[type="${vt}"]`] = {
          "background-image": backgroundImage,
          "background-color": vtConfig.color,
          "background-opacity": vtConfig.backgroundOpacity,
          "border-color": vtConfig.borderColor,
          "border-width": vtConfig.borderWidth,
          "border-opacity": vtConfig.borderWidth ? 1 : 0,
          "border-style": vtConfig.borderStyle,
          shape: vtConfig.shape,
          width: 24,
          height: 24,
        };
      }

      for (const etConfig of deferredEtConfigs) {
        const et = etConfig?.type;

        let label = textTransform(et);
        if (label.length > 20) {
          label = label.substring(0, 17) + "...";
        }

        styles[`edge[type="${et}"]`] = {
          label,
          "source-distance-from-node": 0,
          "target-distance-from-node": 0,
        };

        styles[`edge[type="${et}"]`] = {
          label: (el: cytoscape.EdgeSingular) => {
            const edgeId = el.id() as RenderedEdgeId;
            const displayEdge = displayEdges.get(
              getEdgeIdFromRenderedEdgeId(edgeId)
            );
            return displayEdge
              ? displayEdge.displayName
              : MISSING_DISPLAY_VALUE;
          },
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

      setStyles(styles);
    })();
  }, [
    client,
    deferredEtConfigs,
    deferredVtConfigs,
    displayEdges,
    textTransform,
  ]);

  return styles;
};

export default useGraphStyles;
