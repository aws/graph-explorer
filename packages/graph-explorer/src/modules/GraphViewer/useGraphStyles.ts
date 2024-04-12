import Color from "color";
import { useEffect, useState } from "react";
import { EdgeData } from "../../@types/entities";
import type { GraphProps } from "../../components";
import { useConfiguration } from "../../core";
import useTextTransform from "../../hooks/useTextTransform";
import { renderNode } from "./renderNode";

const LINE_PATTERN = {
  solid: undefined,
  dashed: [5, 6],
  dotted: [1, 2],
};

const useGraphStyles = () => {
  const config = useConfiguration();
  const textTransform = useTextTransform();
  const [styles, setStyles] = useState<GraphProps["styles"]>({});

  useEffect(() => {
    (async () => {
      const styles: GraphProps["styles"] = {};

      for (const vt of config?.vertexTypes || []) {
        const vtConfig = config?.getVertexTypeConfig(vt);
        if (!vtConfig) {
          continue;
        }

        // Process the image data or SVG
        const backgroundImage = await renderNode(vtConfig);

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

      for (const et of config?.edgeTypes || []) {
        let label = textTransform(et);
        if (label.length > 20) {
          label = label.substring(0, 17) + "...";
        }

        styles[`edge[type="${et}"]`] = {
          label,
          "source-distance-from-node": 0,
          "target-distance-from-node": 0,
        };

        const etConfig = config?.getEdgeTypeConfig(et);
        if (!etConfig) {
          continue;
        }

        styles[`edge[type="${et}"]`] = {
          label: (el: cytoscape.EdgeSingular) => {
            const edgeData = el.data() as EdgeData;

            let currentLabel = etConfig.displayLabel || label;

            if (etConfig.displayNameAttribute) {
              const attr = edgeData.attributes[etConfig.displayNameAttribute];
              currentLabel = attr != null ? String(attr) : currentLabel;
            }

            return currentLabel;
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
  }, [config, textTransform]);

  return styles;
};

export default useGraphStyles;
