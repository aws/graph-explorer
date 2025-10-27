import type {
  Badge,
  BadgeRenderer,
} from "@/components/Graph/hooks/useRenderBadges";
import {
  getVertexIdFromRenderedVertexId,
  type RenderedVertexId,
  useDisplayVerticesInCanvas,
  useAllNeighbors,
} from "@/core";

const useNodeBadges = () => {
  const displayNodes = useDisplayVerticesInCanvas();
  const neighborCounts = useAllNeighbors();

  return (outOfFocusIds: Set<RenderedVertexId>): BadgeRenderer =>
    (nodeData, boundingBox, { zoomLevel }) => {
      const vertexId = getVertexIdFromRenderedVertexId(nodeData.id);
      const displayNode = displayNodes.get(vertexId);
      const neighbors = neighborCounts.get(vertexId);
      // Ensure we have the node name and title
      const name = displayNode?.displayName ?? "";
      const title = displayNode?.displayTypes ?? "";
      const unfetched = neighbors?.unfetched ?? 0;

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
        } satisfies Badge,
        {
          hidden:
            zoomLevel === "small" ||
            outOfFocusIds.has(nodeData.id) ||
            !unfetched,
          text: String(unfetched),
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
    };
};

export default useNodeBadges;
