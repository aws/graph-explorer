import Color from "color";
import cytoscape from "cytoscape";
import { useEffect, useState } from "react";
import type { VertexData } from "../../@types/entities";
import type { GraphProps } from "../../components";
import colorizeSvg from "../../components/utils/canvas/colorizeSvg";
import { useConfiguration } from "../../core";
import useTextTransform from "../../hooks/useTextTransform";

const ICONS_CACHE: Map<string, string> = new Map();
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
      const styles: GraphProps["styles"] = {
        node: {
          shape: (el: cytoscape.NodeSingular) => {
            // Change the shape if contains multiple labels
            const node = el.data() as VertexData;
            return node.__v_types.length === 1 ? "ellipse" : "roundrectangle";
          },
        },
      };

      for (const vt of config?.vertexTypes || []) {
        const vtConfig = config?.getVertexTypeConfig(vt);
        if (!vtConfig) {
          continue;
        }

        // To avoid multiple requests, cache icons under the same URL
        let iconText = vtConfig.iconUrl
          ? ICONS_CACHE.get(vtConfig.iconUrl)
          : undefined;
        if (vtConfig.iconUrl && !iconText) {
          const response = await fetch(vtConfig.iconUrl);
          iconText = await response.text();
          ICONS_CACHE.set(vtConfig.iconUrl, iconText);
        }

        styles[`node[__v_type="${vt}"]`] = {
          "background-image":
            iconText && vtConfig.iconImageType === "image/svg+xml"
              ? colorizeSvg(iconText, vtConfig.color || "#128EE5") ||
                "data(__iconUrl)"
              : vtConfig.iconUrl,
          "background-color": vtConfig.color,
          "background-opacity": vtConfig.backgroundOpacity,
          "border-color": vtConfig.borderColor,
          "border-width": vtConfig.borderWidth,
          "border-opacity": vtConfig.borderWidth ? 1 : 0,
          "border-style": vtConfig.borderStyle,
          shape: vtConfig.shape,
        };
      }

      for (const et of config?.edgeTypes || []) {
        let label = textTransform(et);
        if (label.length > 20) {
          label = label.substring(0, 17) + "...";
        }

        styles[`edge[__e_type="${et}"]`] = {
          label,
        };

        const etConfig = config?.getEdgeTypeConfig(et);
        if (!etConfig) {
          continue;
        }

        styles[`edge[__e_type="${et}"]`] = {
          label: etConfig?.displayLabel || label,
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
        };
      }

      setStyles(styles);
    })();
  }, [config, textTransform]);

  return styles;
};

export default useGraphStyles;
