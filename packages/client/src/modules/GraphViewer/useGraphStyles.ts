import { useEffect, useState } from "react";
import type { VertexData } from "../../@types/entities";
import type { GraphProps } from "../../components";
import colorizeSvg from "../../components/utils/canvas/colorizeSvg";
import { useConfiguration } from "../../core";
import useTextTransform from "../../hooks/useTextTransform";

const ICONS_CACHE: Map<string, string> = new Map();

const useGraphStyles = () => {
  const config = useConfiguration();
  const textTransform = useTextTransform();
  const [styles, setStyles] = useState<GraphProps["styles"]>({});

  useEffect(() => {
    (async () => {
      const styles: GraphProps["styles"] = {
        node: {
          shape: el => {
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

        if (!vtConfig.iconUrl) {
          styles[`node[__v_type="${vt}"]`] = {
            "background-image": "data(__iconUrl)",
            backgroundColor: vtConfig.color,
            borderColor: vtConfig.color,
          };
          continue;
        }

        // To avoid multiple requests, cache icons under the same URL
        let iconText = ICONS_CACHE.get(vtConfig.iconUrl);
        if (!iconText) {
          const response = await fetch(vtConfig.iconUrl);
          iconText = await response.text();
          ICONS_CACHE.set(vtConfig.iconUrl, iconText);
        }

        styles[`node[__v_type="${vt}"]`] = {
          "background-image":
            vtConfig.iconImageType === "image/svg+xml"
              ? colorizeSvg(iconText, vtConfig.color || "#128EE5") ||
                "data(__iconUrl)"
              : vtConfig.iconUrl,
          backgroundColor: vtConfig.color,
          borderColor: vtConfig.color,
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
      }

      setStyles(styles);
    })();
  }, [config, textTransform]);

  return styles;
};

export default useGraphStyles;
