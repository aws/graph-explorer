import { useCallback } from "react";
import { BadgeRenderer } from "@/components/Graph/hooks/useRenderBadges";
import { VertexId } from "@/@types/entities";
import { useDisplayVerticesInCanvas } from "@/core";

const useNodeBadges = () => {
  const displayNodes = useDisplayVerticesInCanvas();

  return useCallback(
    (outOfFocusIds: Set<VertexId>): BadgeRenderer =>
      (nodeData, boundingBox, { zoomLevel }) => {
        // Ensure we have the node name and title
        const name = displayNodes.get(nodeData.id)?.displayName ?? "";
        const title = displayNodes.get(nodeData.id)?.displayTypes ?? "";

        return [
          {
            text: name,
            hidden: zoomLevel === "small" || outOfFocusIds.has(nodeData.id),
            title: zoomLevel === "large" ? title : undefined,
            maxWidth: zoomLevel === "large" ? 80 : 50,
            anchor: "center",
            fontSize: 7,
            borderRadius: 2,
            backgroundColor: "rgba(29,37,49,0.6)",
            paddingLeft: 2,
            paddingRight: 2,
            paddingBottom: 2,
            paddingTop: 2,
            boundingBox: {
              x: boundingBox.x + boundingBox.width / 2,
              y: boundingBox.y + boundingBox.height - 6,
              width: "auto",
              height: "auto",
            },
          },
          {
            hidden:
              zoomLevel === "small" ||
              outOfFocusIds.has(nodeData.id) ||
              !nodeData.__unfetchedNeighborCount,
            text: String(nodeData.__unfetchedNeighborCount),
            anchor: "center",
            fontSize: 5,
            borderRadius: 4,
            backgroundColor: "rgba(29,37,49,0.6)",
            paddingLeft: 3,
            paddingRight: 3,
            boundingBox: {
              x: boundingBox.x + boundingBox.width / 2,
              y: boundingBox.y - 6,
              width: "auto",
              height: "auto",
            },
          },
        ];
      },
    [displayNodes]
  );
};

export default useNodeBadges;
