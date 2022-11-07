import { useCallback } from "react";
import { BadgeRenderer } from "../../components/Graph/hooks/useRenderBadges";
import { useConfiguration } from "../../core";
import useDisplayNames from "../../hooks/useDisplayNames";
import useTextTransform from "../../hooks/useTextTransform";

const useNodeBadges = () => {
  const config = useConfiguration();
  const textTransform = useTextTransform();
  const getDisplayNames = useDisplayNames();

  return useCallback(
    (outOfFocusIds: Set<string>): BadgeRenderer => (
      nodeData,
      boundingBox,
      { zoomLevel }
    ) => {
      const { name } = getDisplayNames({ data: nodeData });
      const vtConfig = config?.getVertexTypeConfig(nodeData.__v_type);
      return [
        {
          hidden: zoomLevel === "small",
          title:
            zoomLevel === "large"
              ? vtConfig?.displayLabel || textTransform(nodeData.__v_type)
              : undefined,
          text: name,
          maxWidth: zoomLevel === "large" ? 80 : 50,
          anchor: "center",
          fontSize: 7,
          borderRadius: 6,
          backgroundColor: "rgba(29,37,49,0.6)",
          paddingLeft: 8,
          paddingRight: 8,
          paddingBottom: 4,
          paddingTop: 4,
          boundingBox: {
            x: boundingBox.x + boundingBox.width / 2,
            y: boundingBox.y + boundingBox.height - 4,
            width: "auto",
            height: "auto",
          },
        },
        {
          hidden:
            zoomLevel === "small" ||
            outOfFocusIds.has(nodeData.id) ||
            nodeData.__unfetchedNeighborCount === 0,
          text: String(nodeData.__unfetchedNeighborCount),
          anchor: "center",
          fontSize: 7,
          borderRadius: 6,
          backgroundColor: "rgba(29,37,49,0.6)",
          paddingLeft: 4,
          paddingRight: 4,
          boundingBox: {
            x: boundingBox.x + boundingBox.width / 2,
            y: boundingBox.y - 6,
            width: "auto",
            height: "auto",
          },
        },
      ];
    },
    [config, getDisplayNames, textTransform]
  );
};

export default useNodeBadges;
